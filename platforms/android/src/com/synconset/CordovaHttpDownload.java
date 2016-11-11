/**
 * A HTTP plugin for Cordova / Phonegap
 */
package com.synconset;

import android.util.Log;

import com.github.kevinsawicki.http.HttpRequest;
import com.github.kevinsawicki.http.HttpRequest.HttpRequestException;

import java.io.File;
import java.net.UnknownHostException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Map;

import javax.net.ssl.SSLHandshakeException;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.apache.cordova.file.FileUtils;

import org.json.JSONException;
import org.json.JSONObject;

public class CordovaHttpDownload extends CordovaHttp implements Runnable {
    private final int PROGRESS_CODE = 600;
    private String filePath;
    HttpRequest request;
    private JSONObject progress = new JSONObject();
    private boolean appendToExisting;

    public CordovaHttpDownload(String urlString, Map<?, ?> params, Map<String, String> headers, CallbackContext callbackContext, String filePath, boolean appendToExisting) {
        super(urlString, params, headers, callbackContext);
        this.filePath = filePath;
        this.appendToExisting = appendToExisting;
    }

    @Override
    public void run() {
        try {
            request = HttpRequest.get(this.getUrlString(), this.getParams(), true);
            this.setupSecurity(request);
            request.acceptCharset(CHARSET);
            request.headers(this.getHeaders());
            int code = request.code();
            request.setRequestAppend(appendToExisting);

            JSONObject response = new JSONObject();
            this.addResponseHeaders(request, response);
            response.put("status", code);
            if (code >= 200 && code < 300) {
                registerForProgress();
                URI uri = new URI(filePath);
                File file = new File(uri);
                request.receive(file);
                if (request.isAborted()) {
                    sendAbortCallback();
                } else {
                    JSONObject fileEntry = FileUtils.getFilePlugin().getEntryForFile(file);
                    response.put("file", fileEntry);
                    this.getCallbackContext().success(response);
                }
            } else {
                response.put("error", "There was an error downloading the file");
                this.getCallbackContext().error(response);
            }
        } catch (URISyntaxException e) {
            this.respondWithError("There was an error with the given filePath");
        } catch (JSONException e) {
            this.respondWithError("There was an error generating the response");
        } catch (HttpRequestException e) {
            if (e.getCause() instanceof UnknownHostException) {
                this.respondWithError(0, "The host could not be resolved");
            } else if (e.getCause() instanceof SSLHandshakeException) {
                this.respondWithError("SSL handshake failed");
            } else {
                this.respondWithError("There was an error with the request");
            }
        } finally {
            request.abort(false);
            request.progress(null);
        }
    }

    public void abortDownload() {
        if (request != null) {
            request.abort(true);
        }
    }

    private void sendAbortCallback() {
        if (request != null) {
            try {
                JSONObject response = new JSONObject();
                response.put("status", -1);
                response.put("error", "Request aborted");
                this.addResponseHeaders(request, response);
                this.getCallbackContext().error(response);
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

    }

    public void registerForProgress() {
        if (request != null) {

            try {
                addResponseHeaders(request, progress);
                progress.put("status", PROGRESS_CODE);
                request.progress(new HttpRequest.UploadProgress() {
                    @Override
                    public void onUpload(long uploaded, long total) {
                        try {
                            progress.put("progress", uploaded);
                            PluginResult pluginResult = new PluginResult(PluginResult.Status.OK, progress);
                            pluginResult.setKeepCallback(true);
                            getCallbackContext().sendPluginResult(pluginResult);
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    }
                });
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }


}
