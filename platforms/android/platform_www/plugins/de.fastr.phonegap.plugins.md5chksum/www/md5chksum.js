cordova.define("de.fastr.phonegap.plugins.md5chksum.md5chksum", function(require, exports, module) {
exports.file = function(fileEntry, success, error){
		var path = fileEntry.toURL();
		if (path){
			cordova.exec(success, error, "md5chksum", "file", [path]);
		}else{
			error("md5chksum: no path");
		}
};



});
