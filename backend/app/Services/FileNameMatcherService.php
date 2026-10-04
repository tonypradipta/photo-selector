<?php

namespace App\Services;

use App\Models\Selection;
use Illuminate\Support\Collection;

class FileNameMatcherService
{
    /**
     * @var array<string>
     */
    private array $suffixes;

    public function __construct(?array $customSuffixes = null)
    {
        if ($customSuffixes !== null) {
            $this->suffixes = $customSuffixes;
        } elseif (function_exists('config')) {
            $this->suffixes = config('photo_delivery.matching_suffixes', [
                '_edit', '_edited', '_final', '_v1', '_v2', '_retouch',
                '-edit', '-edited', '-final', '-v1', '-v2', '-retouch',
                ' edit', ' edited', ' final',
            ]);
        } else {
            $this->suffixes = [
                '_edit', '_edited', '_final', '_v1', '_v2', '_retouch',
                '-edit', '-edited', '-final', '-v1', '-v2', '-retouch',
                ' edit', ' edited', ' final',
            ];
        }
    }

    /**
     * Normalize a filename by removing extension, common edit suffixes, and standardizing casing/spaces.
     */
    public function normalize(string $fileName, array $customSuffixes = []): string
    {
        // 1. Remove file extension
        $name = pathinfo($fileName, PATHINFO_FILENAME);

        // 2. Lowercase and trim
        $name = mb_strtolower(trim($name), 'UTF-8');

        // 3. Strip configured suffixes repeatedly until no more match
        $allSuffixes = array_merge($this->suffixes, $customSuffixes);
        $changed = true;
        while ($changed) {
            $changed = false;
            foreach ($allSuffixes as $suffix) {
                $suffixLower = mb_strtolower($suffix, 'UTF-8');
                if (str_ends_with($name, $suffixLower)) {
                    $name = substr($name, 0, -strlen($suffixLower));
                    $name = trim($name);
                    $changed = true;
                }
            }
        }

        // 4. Normalize separators (replace multiple dashes/underscores/spaces with single separator)
        $name = preg_replace('/[\s_\-]+/', '_', $name);

        return trim($name, '_');
    }

    /**
     * Match a collection of selections (raw photos) with drive edited files.
     *
     * @param Collection<Selection> $selections
     * @param array<array{id: string, name: string, mimeType?: string, thumbnailLink?: string, modifiedTime?: string, size?: int}> $editedFiles
     * @return array{
     *     matched: array,
     *     missing: array,
     *     extra: array,
     *     match_rate: float,
     *     total_selected: int,
     *     total_edited: int
     * }
     */
    public function match(Collection $selections, array $editedFiles): array
    {
        $matched = [];
        $missing = [];
        $extra = [];

        // Build a lookup map of selections by normalized raw filename & photo code
        $selectionMap = [];
        foreach ($selections as $selection) {
            $rawName = $selection->photo ? $selection->photo->file_name : '';
            $photoCode = $selection->photo ? $selection->photo->photo_code : null;

            $normRaw = $this->normalize($rawName);
            if ($normRaw !== '') {
                $selectionMap[$normRaw] = [
                    'selection' => $selection,
                    'used' => false,
                ];
            }

            if ($photoCode) {
                $normCode = $this->normalize($photoCode);
                if ($normCode !== '' && !isset($selectionMap[$normCode])) {
                    $selectionMap[$normCode] = [
                        'selection' => $selection,
                        'used' => false,
                    ];
                }
            }
        }

        $usedSelectionIds = [];

        // Process edited files
        foreach ($editedFiles as $editedFile) {
            $editedName = $editedFile['name'] ?? '';
            $normEdited = $this->normalize($editedName);

            $matchedEntry = null;

            // Direct exact normalized match
            if (isset($selectionMap[$normEdited]) && !$selectionMap[$normEdited]['used']) {
                $matchedEntry = $selectionMap[$normEdited]['selection'];
                $selectionMap[$normEdited]['used'] = true;
            } else {
                // Fallback: search if normalized edited name starts with or equals normalized raw name
                foreach ($selectionMap as $normRawKey => &$data) {
                    if (!$data['used'] && (
                        $normEdited === $normRawKey ||
                        str_starts_with($normEdited, $normRawKey . '_') ||
                        str_starts_with($normEdited, $normRawKey . '-')
                    )) {
                        $matchedEntry = $data['selection'];
                        $data['used'] = true;
                        break;
                    }
                }
                unset($data);
            }

            if ($matchedEntry) {
                $usedSelectionIds[] = $matchedEntry->id;
                $matched[] = [
                    'selection_id' => $matchedEntry->id,
                    'photo_id' => $matchedEntry->photo_id,
                    'raw_name' => $matchedEntry->photo ? $matchedEntry->photo->file_name : '',
                    'edited_name' => $editedName,
                    'normalized_name' => $normEdited,
                    'drive_file_id' => $editedFile['id'],
                    'mime_type' => $editedFile['mimeType'] ?? null,
                    'thumbnail_url' => $editedFile['thumbnailLink'] ?? null,
                    'modified_time' => $editedFile['modifiedTime'] ?? null,
                    'size_bytes' => $editedFile['size'] ?? null,
                    'client_note' => $matchedEntry->client_note,
                ];
            } else {
                $extra[] = [
                    'drive_file_id' => $editedFile['id'],
                    'edited_name' => $editedName,
                    'normalized_name' => $normEdited,
                    'mime_type' => $editedFile['mimeType'] ?? null,
                    'thumbnail_url' => $editedFile['thumbnailLink'] ?? null,
                    'modified_time' => $editedFile['modifiedTime'] ?? null,
                    'size_bytes' => $editedFile['size'] ?? null,
                ];
            }
        }

        // Identify missing selections
        foreach ($selections as $selection) {
            if (!in_array($selection->id, $usedSelectionIds)) {
                $missing[] = [
                    'selection_id' => $selection->id,
                    'photo_id' => $selection->photo_id,
                    'raw_name' => $selection->photo ? $selection->photo->file_name : '',
                    'normalized_name' => $selection->photo ? $this->normalize($selection->photo->file_name) : '',
                    'thumbnail_url' => $selection->photo ? $selection->photo->drive_thumbnail_url : null,
                    'client_note' => $selection->client_note,
                ];
            }
        }

        $totalSelected = $selections->count();
        $matchRate = $totalSelected > 0 ? round((count($matched) / $totalSelected) * 100, 1) : 0;

        return [
            'matched' => $matched,
            'missing' => $missing,
            'extra' => $extra,
            'match_rate' => $matchRate,
            'total_selected' => $totalSelected,
            'total_edited' => count($editedFiles),
        ];
    }
}
