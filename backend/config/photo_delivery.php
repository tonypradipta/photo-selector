<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Normalized Suffixes for File Name Matcher
    |--------------------------------------------------------------------------
    | Suffixes that photographers commonly append to edited files.
    | Matcher will strip these when matching edited files with raw selected filenames.
    */
    'matching_suffixes' => [
        '_edit',
        '_edited',
        '_final',
        '_v1',
        '_v2',
        '_retouch',
        '-edit',
        '-edited',
        '-final',
        '-v1',
        '-v2',
        '-retouch',
        ' edit',
        ' edited',
        ' final',
    ],

    /*
    |--------------------------------------------------------------------------
    | Delivery Link Expiry (Days)
    |--------------------------------------------------------------------------
    | Default expiry duration in days when creating a delivery link.
    | 0 means no expiry by default.
    */
    'default_expiry_days' => 30,

    /*
    |--------------------------------------------------------------------------
    | Allowed Extensions for Edited Photos
    |--------------------------------------------------------------------------
    */
    'allowed_extensions' => ['jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff'],

    /*
    |--------------------------------------------------------------------------
    | PIN Rate Limiting & Max Attempts
    |--------------------------------------------------------------------------
    */
    'max_pin_attempts' => 5,
    'pin_decay_minutes' => 15,
];
