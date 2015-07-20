'use strict';

var _ = require('underscore'),
    path = require('path'),
    fs = require('fs'),
    async = require('async'),
    Jimp = require('jimp');

function readImage(path, callback) {
    // create image using jimp so the data can be used when rendering the sprite image
    var image = new Jimp(path, function(err, image) {
        callback(err, {
            path: path,
            width: image.bitmap.width,
            height: image.bitmap.height,
            data: image
        });
    });
}

function readImages(filePaths, callback) {
    async.mapLimit(filePaths, 80, readImage, function (err, result) {
        if (err) {
            return callback(err);
        }
        // NOTE: async.mapLimit() apparently does not guarantee output order will match input order.
        // Restore the expected order before executing callback.
        callback(null, _(filePaths).map(function(filePath) {
            return _(result).findWhere({ path: filePath });
        }));
    });
}

function renderSprite(layout, filePath, options, callback) {
    var defaults = {
        compressionLevel: 6,
        filter: 'all'
    };
    
    options = _.extend({}, defaults, options);
    
    var sheet = new Jimp(layout.width, layout.height, function(err, sheet) {
        async.eachLimit(layout.images, 20, function(image, cb) {
            sheet.blit(image.data, image.x, image.y, cb);
        }, function(eachError) {
            if(eachError) {
                return callback(eachError);
            }

            sheet.quality(options.compressionLevel * 10);

            sheet.write(filePath, function(writeError) {
                callback(writeError);
            });
        });
    });
}