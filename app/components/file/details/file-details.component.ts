import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { autobind } from "core-decorators";
import { remote } from "electron";
import { writeFile } from "fs";
import { Observable, Subscription } from "rxjs";

import { NotificationService } from "app/components/base/notifications";
import { File, ServerError } from "app/models";
import { FileService, StorageService } from "app/services";
import { RxEntityProxy } from "app/services/core";
import { Constants, FileUrlUtils, log, prettyBytes } from "app/utils";

@Component({
    selector: "bl-file-details",
    templateUrl: "file-details.html",
})
export class FileDetailsComponent implements OnInit, OnDestroy {
    public static breadcrumb({filename}) {
        return { name: filename, label: "File", invertName: true };
    }

    public jobId: string;
    public taskId: string;
    public nodeId: string;
    public poolId: string;
    public url: string;
    public filename: string;
    public contentSize: string;
    public downloadEnabled: boolean;
    public outputKind: string;

    private _sourceType: string;
    private _paramsSubscribers: Subscription[] = [];
    private _propertyProxy: RxEntityProxy<any, File>;

    constructor(
        private route: ActivatedRoute,
        private fileService: FileService,
        private notificationService: NotificationService,
        private storageService: StorageService) {
        this.downloadEnabled = true;
    }

    public ngOnInit() {
        this._paramsSubscribers.push(this.route.data.subscribe((data) => {
            this._sourceType = data["type"];
        }));

        this._paramsSubscribers.push(this.route.params.subscribe((params) => {
            this.jobId = params["jobId"];
            this.taskId = params["taskId"];
            this.poolId = params["poolId"];
            this.nodeId = params["nodeId"];
            this.outputKind = params["outputKind"];
            this.filename = params["filename"];

            this._loadFileProperties();
        }));
    }

    public ngOnDestroy() {
        this._paramsSubscribers.forEach(x => x.unsubscribe());
    }

    @autobind()
    public refresh() {
        return Observable.of({});
    }

    public downloadFile() {
        const dialog = remote.dialog;
        const localPath = dialog.showSaveDialog({
            buttonLabel: "Download",
            // Set default filename of file to download
            defaultPath: FileUrlUtils.getFileName(this.url),
        });

        if (localPath) {
            this._saveFile(localPath);
        }
    }

    private _loadFileProperties(): void {
        if (this._sourceType === Constants.FileSourceTypes.Job) {
            // it's a file from a job's task
            this._propertyProxy = this.fileService.getFilePropertiesFromTask(
                this.jobId, this.taskId, this.filename);

        } else if (this._sourceType === Constants.FileSourceTypes.Pool) {
            // it's a file from a node
            this._propertyProxy = this.fileService.getFilePropertiesFromComputeNode(
                this.poolId, this.nodeId, this.filename);

        } else if (this._sourceType === Constants.FileSourceTypes.Blob) {
            // it's a file from blob storage
            this._propertyProxy = this.storageService.getBlobProperties(
                this.jobId,
                this.taskId,
                this.outputKind,
                this.filename,
            );
        } else {
            throw "Unrecognised source type: " + this._sourceType;
        }

        this._propertyProxy.fetch().subscribe((details: any) => {
            this.contentSize = prettyBytes(details.properties.contentLength);
            this.url = decodeURIComponent(details.url);
        });

        this._propertyProxy = null;
    }

    private _saveFile(pathToFile) {
        if (pathToFile === undefined) {
            return;
        }

        const obj = FileUrlUtils.parseRelativePath(this.url);
        if (obj.type === Constants.FileSourceTypes.Job) {
            this.fileService.getFileContentFromTask(
                this.jobId, this.taskId, this.filename).subscribe((data) => {
                    this._writeToFile(pathToFile, data.content);
                });

        } else if (this._sourceType === Constants.FileSourceTypes.Pool) {
            this.fileService.getFileContentFromComputeNode(
                this.poolId, this.nodeId, this.filename).subscribe((data) => {
                    this._writeToFile(pathToFile, data.content);
                });

        } else if (this._sourceType === Constants.FileSourceTypes.Blob) {
            const blobName = `${this.taskId}/${this.outputKind}/${this.filename}`;
            this.storageService.saveBlobToFile(this.jobId, blobName, pathToFile).subscribe({
                error: (error: ServerError) => {
                    this.notificationService.error(
                        "Download failed",
                        `${this.filename} failed to download. ${error.body.message}`,
                    );
                },
            });

        } else {
            throw "Unrecognised source type: " + this._sourceType;
        }
    }

    private _writeToFile(filename: string, data: any): void {
        writeFile(filename, data.content, (error) => {
            // Callback to get rid of the following console error
            // DeprecationWarning: Calling an asynchronous function without callback is deprecated.
            if (error) {
                log.error("[FileDetails.component] writeFile error:", error);
            }
        });
    }
}
