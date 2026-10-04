<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class GoogleDriveService
{
    private string $projectId;
    private string $serviceAccountEmail;
    private string $privateKey;
    private string $apiKey;
    private ?string $accessToken = null;

    public function __construct()
    {
        $this->projectId           = (string) config('services.google.project_id', '');
        $this->serviceAccountEmail = (string) config('services.google.service_account_email', '');
        $this->privateKey          = $this->formatPrivateKey((string) config('services.google.private_key', ''));
        $this->apiKey              = (string) config('services.google.api_key', '');
    }

    public function hasServiceAccount(): bool
    {
        return $this->serviceAccountEmail !== ''
            && $this->privateKey !== ''
            && str_contains($this->privateKey, 'BEGIN')
            && ! str_contains($this->privateKey, '...');
    }

    public function hasCredentials(): bool
    {
        return $this->hasServiceAccount() || $this->apiKey !== '';
    }

    public function serviceAccountEmail(): string
    {
        return $this->serviceAccountEmail;
    }

    /**
     * List all image files in a Google Drive folder (paginated).
     */
    public function listPhotos(string $folderId): array
    {
        if (! $this->hasCredentials()) {
            throw new Exception(
                'Kredensial Google Drive belum diisi di backend/.env. '.
                'Isi GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_PRIVATE_KEY (disarankan) atau GOOGLE_API_KEY.'
            );
        }

        $photos = [];
        $pageToken = null;

        do {
            $query = [
                'q'                        => "'{$folderId}' in parents and mimeType contains 'image/' and trashed=false",
                'fields'                   => 'nextPageToken,files(id,name,mimeType,thumbnailLink,modifiedTime,imageMediaMetadata)',
                'pageSize'                 => 1000,
                'orderBy'                  => 'name',
                'supportsAllDrives'        => 'true',
                'includeItemsFromAllDrives'=> 'true',
            ];

            if ($pageToken) {
                $query['pageToken'] = $pageToken;
            }

            $response = $this->driveGet('https://www.googleapis.com/drive/v3/files', $query);

            if (! $response->successful()) {
                throw new Exception($this->formatDriveError($response->status(), $response->json(), $response->body()));
            }

            foreach ($response->json('files', []) as $file) {
                if (empty($file['id']) || empty($file['name'])) {
                    continue;
                }

                $rawThumb = $file['thumbnailLink'] ?? "https://lh3.googleusercontent.com/d/{$file['id']}=s800";
                $thumbUrl = preg_replace('/=s\d+.*$/', '=s800', $rawThumb);

                $photos[] = [
                    'id'            => $file['id'],
                    'name'          => $file['name'],
                    'mimeType'      => $file['mimeType'] ?? 'image/jpeg',
                    'thumbnailLink' => $thumbUrl,
                    'modifiedTime'  => $file['modifiedTime'] ?? null,
                    'width'         => $file['imageMediaMetadata']['width'] ?? null,
                    'height'        => $file['imageMediaMetadata']['height'] ?? null,
                ];
            }

            $pageToken = $response->json('nextPageToken');
        } while (! empty($pageToken));

        return $photos;
    }

    /**
     * Stream or download photo from Google Drive using Service Account.
     */
    public function streamPhoto(string $driveFileId): ?array
    {
        if (! $this->hasServiceAccount()) {
            return null;
        }

        try {
            $token = $this->getAccessToken();

            // 1. Try fetching high-res thumbnail with token (fastest)
            $meta = Http::withToken($token)->timeout(15)->get("https://www.googleapis.com/drive/v3/files/{$driveFileId}", [
                'fields'            => 'thumbnailLink,mimeType',
                'supportsAllDrives' => 'true',
            ]);

            if ($meta->successful() && ! empty($meta->json('thumbnailLink'))) {
                $thumbUrl = preg_replace('/=s\d+.*$/', '=s1200', $meta->json('thumbnailLink'));
                $imgRes = Http::withToken($token)->timeout(25)->get($thumbUrl);
                if ($imgRes->successful() && strlen($imgRes->body()) > 0) {
                    return [
                        'content' => $imgRes->body(),
                        'mime'    => $imgRes->header('Content-Type') ?: ($meta->json('mimeType') ?: 'image/jpeg'),
                    ];
                }
            }

            // 2. Fallback: alt=media stream
            $mediaRes = Http::withToken($token)->timeout(30)->get("https://www.googleapis.com/drive/v3/files/{$driveFileId}?alt=media&supportsAllDrives=true");
            if ($mediaRes->successful() && strlen($mediaRes->body()) > 0) {
                return [
                    'content' => $mediaRes->body(),
                    'mime'    => $mediaRes->header('Content-Type') ?: 'image/jpeg',
                ];
            }
        } catch (Exception $e) {
            // Failed to stream
        }

        return null;
    }

    /**
     * Check if a folder is accessible by the configured credentials.
     */
    public function checkFolderAccess(string $folderId): array
    {
        try {
            $response = $this->driveGet("https://www.googleapis.com/drive/v3/files/{$folderId}", [
                'fields'            => 'id,name,mimeType',
                'supportsAllDrives' => 'true',
            ]);

            if ($response->status() === 404) {
                return [
                    'accessible' => false,
                    'error'      => 'Folder tidak ditemukan. Pastikan URL folder benar dan folder sudah dibagikan ke service account.',
                ];
            }

            if ($response->status() === 403) {
                $hint = $this->serviceAccountEmail !== ''
                    ? ' Bagikan folder ke: '.$this->serviceAccountEmail
                    : '';

                return ['accessible' => false, 'error' => 'Akses ditolak.'.$hint];
            }

            if (! $response->successful()) {
                return ['accessible' => false, 'error' => $this->formatDriveError($response->status(), $response->json(), $response->body())];
            }

            return ['accessible' => true];
        } catch (Exception $e) {
            return ['accessible' => false, 'error' => $e->getMessage()];
        }
    }

    private function driveGet(string $url, array $query)
    {
        $request = Http::timeout(60)->acceptJson();

        if ($this->hasServiceAccount()) {
            return $request->withToken($this->getAccessToken())->get($url, $query);
        }

        $query['key'] = $this->apiKey;

        return $request->get($url, $query);
    }

    private function formatDriveError(int $status, mixed $json, string $body): string
    {
        $message = is_array($json) ? ($json['error']['message'] ?? null) : null;
        $detail  = $message ?: $body;

        if ($status === 403 || str_contains(strtolower((string) $detail), 'access')) {
            $share = $this->serviceAccountEmail !== ''
                ? " Bagikan folder Google Drive (Viewer) ke {$this->serviceAccountEmail}."
                : '';

            return "Google Drive menolak akses.{$share} Detail: {$detail}";
        }

        return "Gagal membaca Google Drive ({$status}): {$detail}";
    }

    private function getAccessToken(): string
    {
        if ($this->accessToken) {
            return $this->accessToken;
        }

        $cacheKey = 'google_drive_access_token';
        if (Cache::has($cacheKey)) {
            return $this->accessToken = Cache::get($cacheKey);
        }

        $token = $this->generateServiceAccountToken();
        Cache::put($cacheKey, $token, now()->addMinutes(55));

        return $this->accessToken = $token;
    }

    private function generateServiceAccountToken(): string
    {
        $now = time();
        $exp = $now + 3600;

        $header = $this->base64UrlEncode(json_encode([
            'alg' => 'RS256',
            'typ' => 'JWT',
        ]));

        $payload = $this->base64UrlEncode(json_encode([
            'iss'   => $this->serviceAccountEmail,
            'scope' => 'https://www.googleapis.com/auth/drive.readonly',
            'aud'   => 'https://oauth2.googleapis.com/token',
            'iat'   => $now,
            'exp'   => $exp,
        ]));

        $signingInput = "{$header}.{$payload}";
        $privateKey   = openssl_pkey_get_private($this->privateKey);
        if (! $privateKey) {
            throw new Exception(
                'GOOGLE_PRIVATE_KEY tidak valid. Simpan sebagai satu baris dengan \\n, termasuk header BEGIN/END PRIVATE KEY. '.
                openssl_error_string()
            );
        }

        openssl_sign($signingInput, $signature, $privateKey, OPENSSL_ALGO_SHA256);
        $jwt = "{$signingInput}.".$this->base64UrlEncode($signature);

        $response = Http::asForm()->timeout(30)->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ]);

        if (! $response->successful()) {
            throw new Exception('Gagal mendapatkan token Google: '.$response->body());
        }

        $token = $response->json('access_token');
        if (! $token) {
            throw new Exception('Google tidak mengembalikan access token.');
        }

        return $token;
    }

    private function formatPrivateKey(string $rawKey): string
    {
        $key = trim($rawKey);

        if ($key === '') {
            return '';
        }

        if (str_starts_with($key, '{') && str_ends_with($key, '}')) {
            $parsed = json_decode($key, true);
            if (is_array($parsed) && ! empty($parsed['private_key'])) {
                $key = $parsed['private_key'];
            }
        }

        if (
            (str_starts_with($key, '"') && str_ends_with($key, '"'))
            || (str_starts_with($key, "'") && str_ends_with($key, "'"))
        ) {
            $key = substr($key, 1, -1);
        }

        $key = str_replace(['\\n', "\r\n", "\r"], "\n", $key);

        return trim($key);
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
