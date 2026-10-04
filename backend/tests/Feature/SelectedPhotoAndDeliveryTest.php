<?php

namespace Tests\Feature;

use App\Models\Delivery;
use App\Models\EditedPhoto;
use App\Models\Photo;
use App\Models\Project;
use App\Models\Selection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SelectedPhotoAndDeliveryTest extends TestCase
{
    use RefreshDatabase;

    public function test_selected_photos_list_and_details(): void
    {
        $user = User::factory()->create();
        $project = Project::create([
            'user_id' => $user->id,
            'name' => 'Graduation Divisi Litbang',
            'client_name' => 'Budi Santoso',
            'drive_folder_id' => 'folder_123',
            'drive_folder_url' => 'https://drive.google.com/drive/folders/folder_123',
            'client_token' => 'token_client_1',
            'status' => 'selected',
            'max_photos' => 10,
        ]);

        $photo = Photo::create([
            'project_id' => $project->id,
            'drive_file_id' => 'photo_drive_1',
            'file_name' => 'DSC_0001.JPG',
            'photo_code' => 'DSC0001',
        ]);

        $selection = Selection::create([
            'project_id' => $project->id,
            'photo_id' => $photo->id,
            'client_note' => 'Edit warna lebih hangat',
            'edit_status' => 'pending',
        ]);

        $response = $this->actingAs($user)->getJson('/api/selected-photos');
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.name', 'Graduation Divisi Litbang');

        // Test show details
        $detailRes = $this->actingAs($user)->getJson("/api/selected-photos/{$project->id}");
        $detailRes->assertStatus(200);
        $detailRes->assertJsonPath('selections.0.client_note', 'Edit warna lebih hangat');

        // Test start editing
        $startEditRes = $this->actingAs($user)->postJson("/api/selected-photos/{$project->id}/start-editing");
        $startEditRes->assertStatus(200);
        $this->assertEquals('editing', $project->fresh()->status);
        $this->assertEquals('editing', $selection->fresh()->edit_status);

        // Test export TXT
        $exportTxtRes = $this->actingAs($user)->get("/api/selected-photos/{$project->id}/export?format=txt");
        $exportTxtRes->assertStatus(200);
        $this->assertStringContainsString('DSC_0001.JPG', $exportTxtRes->getContent());

        // Test export CSV
        $exportCsvRes = $this->actingAs($user)->get("/api/selected-photos/{$project->id}/export?format=csv");
        $exportCsvRes->assertStatus(200);
        $this->assertStringContainsString('Edit warna lebih hangat', $exportCsvRes->getContent());
    }

    public function test_delivery_creation_and_public_access_with_pin(): void
    {
        $user = User::factory()->create();
        $project = Project::create([
            'user_id' => $user->id,
            'name' => 'Wedding Event 2026',
            'client_name' => 'Andi & Siti',
            'drive_folder_id' => 'raw_folder_123',
            'drive_folder_url' => 'https://drive.google.com/drive/folders/raw_folder_123',
            'edited_folder_id' => 'edit_folder_456',
            'edited_folder_url' => 'https://drive.google.com/drive/folders/edit_folder_456',
            'client_token' => 'client_tok_2',
            'status' => 'editing',
            'max_photos' => 5,
        ]);

        $photo = Photo::create([
            'project_id' => $project->id,
            'drive_file_id' => 'p1',
            'file_name' => 'WED_01.JPG',
        ]);

        $selection = Selection::create([
            'project_id' => $project->id,
            'photo_id' => $photo->id,
            'edit_status' => 'ready',
        ]);

        $editedPhoto = EditedPhoto::create([
            'project_id' => $project->id,
            'selection_id' => $selection->id,
            'drive_file_id' => 'ep1',
            'file_name' => 'WED_01_edited.jpg',
            'normalized_name' => 'wed_01',
            'match_status' => 'matched',
            'mime_type' => 'image/jpeg',
            'drive_thumbnail_url' => 'https://lh3.googleusercontent.com/d/ep1=s800',
        ]);

        // 1. Photographer sends delivery with PIN 1234
        $sendRes = $this->actingAs($user)->postJson("/api/deliveries/{$project->id}/send", [
            'pin' => '1234',
            'expires_in_days' => 7,
            'notes' => 'Semoga suka hasil fotonya!',
        ]);

        $sendRes->assertStatus(200);
        $sendRes->assertJsonPath('delivery.status', 'active');
        $this->assertEquals('completed', $project->fresh()->status);

        $deliveryToken = $sendRes->json('delivery.delivery_token');
        $this->assertNotEmpty($deliveryToken);

        // 2. Client visits public delivery page without PIN -> should indicate PIN protected
        $publicRes = $this->getJson("/api/delivery/{$deliveryToken}");
        $publicRes->assertStatus(200);
        $publicRes->assertJsonPath('delivery.is_pin_protected', true);
        $publicRes->assertJsonPath('delivery.unlocked', false);
        $this->assertNull($publicRes->json('photos'));

        // 3. Client submits wrong PIN
        $wrongPinRes = $this->postJson("/api/delivery/{$deliveryToken}/pin", ['pin' => '9999']);
        $wrongPinRes->assertStatus(401);

        // 4. Client submits correct PIN
        $correctPinRes = $this->postJson("/api/delivery/{$deliveryToken}/pin", ['pin' => '1234']);
        $correctPinRes->assertStatus(200);
        $correctPinRes->assertCookie('delivery_pin_' . $deliveryToken);

        // 5. Client visits public delivery with header or cookie
        $unlockedRes = $this->withHeader('X-Delivery-PIN', '1234')->getJson("/api/delivery/{$deliveryToken}");
        $unlockedRes->assertStatus(200);
        $unlockedRes->assertJsonPath('delivery.unlocked', true);
        $unlockedRes->assertJsonCount(1, 'photos');
        $unlockedRes->assertJsonPath('photos.0.file_name', 'WED_01_edited.jpg');
    }
}
