/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        
		$(".start").on("click", startStopDownload);
		$(".del").on("click", deleteFile);
		$(".md5button").on("click", showMd5);
		$(".filesize").on("click", filesize);
        console.log('Received Event: ' + id);
    }
};

app.initialize();



var APP_FOLDER = "AppForPlugins";
//var SONG_URL = "https://traffic.libsyn.com/secure/mixergy/1.mp3";
var SONG_URL = "https://secure-hwcdn.libsyn.com/p/6/2/3/6236f647b7714eba/1.mp3?c_id=7997049&expiration=1478822879&hwt=34eb10ebbfd67c097f5af5266deedf7f";
var FILE_NAME = "1.mp3";

var downloadInProgress = false;

function startStopDownload(){
	
	if(downloadInProgress){
		// stop download
		downloadInProgress = false;
		cordovaHTTP.abortDownload();

	}else{
		// start download
		startDownload(FILE_NAME);

	}

}

function startDownload(filename){

    // check if file already exists then calculate its length
    getFile(filename, false, function(fileEntry){

        fileEntry.getMetadata(

            function (metadata) {
                var size = metadata.size;
                console.log("File size: "+size);
                size = size-1;
                if(size < 0){
                    size = 0;
                }

                startDownloadFrom(filename, size);
            },
            function (error) {
                alert("Error in getting File size: "+error);
            }
        );


    }, function(err){
        // file does not exist so start a fresh download
        startDownloadFrom(filename, 0);
    });

}

function startDownloadFrom(filename, range){

    // First create file or get already created file.
    getFile(filename, true, function(fileEntry){

        // File is created now start downloading
        downloadInProgress = true;

        cordovaHTTP.downloadFile(SONG_URL,
        {},
        {
            "Range": "bytes="+range+"-"
        },
        fileEntry.toURL(),
        true, // append download to file if exists else create new one
        function(entry) {
            downloadInProgress = false;

            // prints the filePath
            alert("File is downloaded successfully at location:\n"+entry.fullPath);

        }, function(response) {
            // check if it is aborted
            if(response.status == -1){
                // it is aborted
                alert(response.error);
            }else{
                alert("Error in downloading file");
            }
            downloadInProgress = false;
        }, function(resp){
            $("#progress").text(resp.progress);
            $("#headers").text(JSON.stringify(resp.headers));
        });

    }, function(error){
        alert("Error in creating file in memory");
    });

}


function deleteFile(){
    removeFile(FILE_NAME);
}

function removeFile(filename){
    getFile(filename, false, function(fileEntry){

        fileEntry.remove(function(file){
           $("#progress").text("");
           $("#headers").text("");
           $("#md5").text("");
           alert("File removed!");
        },function(){
           alert("error deleting the file " + error.code);
        });

    }, function(err){
        alert("File does not exist");

    });

}

function showMd5(){
    getFile(FILE_NAME, false, function(fileEntry){

        md5chksum.file(fileEntry, function(md5sum){
            $("#md5").text(md5sum);
        }, function(error){
            $("#md5").text("Error-Message: " + error);
        });

    }, function(err){
        alert("File does not exist");

    });
}

function getFile(filename, newIfMissing, success, error){
    createAppDirectory(newIfMissing, function(dirEntry){
        dirEntry.getFile(filename, { create: newIfMissing, exclusive: false }, function (fileEntry) {
            success(fileEntry);
        }, error);
    }, error)
}

function createAppDirectory(newIfMissing, success, fail) {
    window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (rootDirEntry) {
        rootDirEntry.getDirectory(APP_FOLDER, { create: newIfMissing }, function (dirEntry) {
            success(dirEntry);
        }, fail);
    }, fail);
}

function filesize(){
// check if file already exists then calculate its length
    getFile(FILE_NAME, false, function(fileEntry){

        fileEntry.getMetadata(

            function (metadata) {
                var size = metadata.size;
                alert("File size: "+size);

            },
            function (error) {
                console.log("Error in File size: "+error);
            }
        );


    }, function(err){
        // file does not exist so start a fresh download
        alert("File not exists");
    });
}