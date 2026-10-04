<?php

namespace Tests\Unit;

use App\Models\Photo;
use App\Models\Selection;
use App\Services\FileNameMatcherService;
use Tests\TestCase;

class FileNameMatcherTest extends TestCase
{
    private FileNameMatcherService $matcher;

    protected function setUp(): void
    {
        parent::setUp();
        $this->matcher = new FileNameMatcherService();
    }

    public function test_normalizes_filenames_properly(): void
    {
        $this->assertEquals('img_1234', $this->matcher->normalize('IMG_1234.JPG'));
        $this->assertEquals('dsc_0050', $this->matcher->normalize('DSC_0050_edit.jpg'));
        $this->assertEquals('dsc_0050', $this->matcher->normalize('DSC_0050_edited.jpeg'));
        $this->assertEquals('dsc_0050', $this->matcher->normalize('DSC_0050_final.PNG'));
        $this->assertEquals('dsc_0050', $this->matcher->normalize('DSC_0050-v1.webp'));
        $this->assertEquals('dsc_0050', $this->matcher->normalize('DSC 0050 final.jpg'));
    }

    public function test_matches_edited_files_with_selections(): void
    {
        $photo1 = new Photo(['file_name' => 'IMG_1001.JPG', 'photo_code' => 'IMG1001']);
        $photo1->id = 1;

        $photo2 = new Photo(['file_name' => 'IMG_1002.CR3', 'photo_code' => 'IMG1002']);
        $photo2->id = 2;

        $photo3 = new Photo(['file_name' => 'IMG_1003.JPG', 'photo_code' => 'IMG1003']);
        $photo3->id = 3;

        $sel1 = new Selection(['client_note' => 'Tolong cerahkan wajah']);
        $sel1->id = 10;
        $sel1->photo_id = 1;
        $sel1->setRelation('photo', $photo1);

        $sel2 = new Selection();
        $sel2->id = 11;
        $sel2->photo_id = 2;
        $sel2->setRelation('photo', $photo2);

        $sel3 = new Selection();
        $sel3->id = 12;
        $sel3->photo_id = 3;
        $sel3->setRelation('photo', $photo3);

        $selections = collect([$sel1, $sel2, $sel3]);

        $editedDriveFiles = [
            [
                'id' => 'drive-id-1',
                'name' => 'IMG_1001_edited.jpg',
                'mimeType' => 'image/jpeg',
            ],
            [
                'id' => 'drive-id-2',
                'name' => 'IMG_1002_final.jpg',
                'mimeType' => 'image/jpeg',
            ],
            [
                'id' => 'drive-id-99',
                'name' => 'RANDOM_EXTRA_PHOTO.jpg',
                'mimeType' => 'image/jpeg',
            ],
        ];

        $result = $this->matcher->match($selections, $editedDriveFiles);

        $this->assertCount(2, $result['matched']);
        $this->assertCount(1, $result['missing']);
        $this->assertCount(1, $result['extra']);
        $this->assertEquals(66.7, $result['match_rate']);

        // Check matched photo details
        $this->assertEquals('IMG_1001_edited.jpg', $result['matched'][0]['edited_name']);
        $this->assertEquals('Tolong cerahkan wajah', $result['matched'][0]['client_note']);

        // Check missing photo
        $this->assertEquals('IMG_1003.JPG', $result['missing'][0]['raw_name']);

        // Check extra photo
        $this->assertEquals('RANDOM_EXTRA_PHOTO.jpg', $result['extra'][0]['edited_name']);
    }
}
