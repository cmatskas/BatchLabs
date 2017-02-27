import { Component, OnDestroy, OnInit, ViewContainerRef } from "@angular/core";
import { MdDialog, MdDialogConfig } from "@angular/material";
import { ActivatedRoute, Router } from "@angular/router";
import { autobind } from "core-decorators";
import { Subscription } from "rxjs/Subscription";

import { Job, Task } from "app/models";
import { JobDecorator } from "app/models/decorators";
import { JobParams, JobService, TaskListParams, TaskParams, TaskService } from "app/services";
import { RxEntityProxy, RxListProxy } from "app/services/core";
import { SidebarManager } from "../../base/sidebar";
import { TaskCreateBasicDialogComponent } from "../../task/action";

import {
    DeleteJobDialogComponent,
    DisableJobDialogComponent,
    EnableJobDialogComponent,
    JobCreateBasicDialogComponent,
    TerminateJobDialogComponent,
} from "../action";

@Component({
    selector: "bl-job-details",
    templateUrl: "job-details.html",
})
export class JobDetailsComponent implements OnInit, OnDestroy {
    public static breadcrumb({id}, {tab}) {
        let label = tab ? `Job - ${tab}` : "Job";
        return {
            name: id,
            label,
        };
    }

    public jobId: string;
    public job: Job;
    public decorator: JobDecorator;
    public data: RxEntityProxy<JobParams, Job>;
    public taskData: RxListProxy<TaskListParams, Task>;

    // Task counts
    public activeTasks: number;
    public runningTasks: number;
    public completedTasks: number;

    private _paramsSubscriber: Subscription;
    private _taskListOptions = { maxResults: 1000, select: "id,state" };

    constructor(
        private dialog: MdDialog,
        private activatedRoute: ActivatedRoute,
        private viewContainerRef: ViewContainerRef,
        private sidebarManager: SidebarManager,
        private jobService: JobService,
        private taskService: TaskService,
        private router: Router) {

        this.data = this.jobService.get(null, {});
        this.data.item.subscribe((job) => {
            this.job = job;
            if (job) {
                this.decorator = new JobDecorator(job);
            }
        });

        this.data.deleted.subscribe((key) => {
            if (this.jobId === key) {
                this.router.navigate(["/jobs"]);
            }
        });

        this.taskData = this.taskService.list(null, {});
        this.taskData.items.subscribe( (tasks) => {
                this.completedTasks = 0;
                this.runningTasks = 0;

                let active = 0;
                let running = 0;
                let completed = 0;

                tasks.forEach( (task) => {
                    switch (task.state) {
                        case "active":
                            active++;
                        break;
                        case "running":
                            running++;
                        default:
                            completed++;
                        break;
                    }
                });

                this.activeTasks = active;
                this.runningTasks = running;
                this.completedTasks = completed;

                console.log("Task count: ", this.totalTasks, active, running, completed);
            });
    }

    public ngOnInit() {
        this._paramsSubscriber = this.activatedRoute.params.subscribe((params) => {
            this.jobId = params["id"];
            this.data.params = { id: this.jobId };
            this.data.fetch();

            // this.status = this.data.status;
            // this.changeDetectorRef.detectChanges();
            console.log("job id:", this.jobId);
            this.taskData = this.taskService.list(this.jobId, this._taskListOptions);
            this.taskData.setOptions(Object.assign({}, {}));
            this.taskData.fetchAll();
        });
    }

    public ngOnDestroy() {
        this._paramsSubscriber.unsubscribe();
    }

    public get filterPlaceholderText() {
        return "Filter by task id";
    }

    @autobind()
    public refresh() {
        this.taskData.fetchAll();
        return this.data.refresh();
    }

    public addTask() {
        const createRef = this.sidebarManager.open("add-basic-task", TaskCreateBasicDialogComponent);
        createRef.component.jobId = this.job.id;
    }

    public terminateJob() {
        let config = new MdDialogConfig();
        config.viewContainerRef = this.viewContainerRef;

        const dialogRef = this.dialog.open(TerminateJobDialogComponent, config);
        dialogRef.componentInstance.jobId = this.job.id;
        dialogRef.afterClosed().subscribe((obj) => {
            this.refresh();
        });
    }

    public deleteJob() {
        let config = new MdDialogConfig();
        config.viewContainerRef = this.viewContainerRef;
        const dialogRef = this.dialog.open(DeleteJobDialogComponent, config);
        dialogRef.componentInstance.jobId = this.job.id;
    }

    public disableJob() {
        let config = new MdDialogConfig();
        config.viewContainerRef = this.viewContainerRef;

        const dialogRef = this.dialog.open(DisableJobDialogComponent, config);
        dialogRef.componentInstance.jobId = this.job.id;
        dialogRef.afterClosed().subscribe((obj) => {
            this.refresh();
        });
    }

    public cloneJob() {
        const ref = this.sidebarManager.open("add-basic-pool", JobCreateBasicDialogComponent);
        ref.component.setValue(this.job);
    }

    public enableJob() {
        let config = new MdDialogConfig();
        config.viewContainerRef = this.viewContainerRef;

        const dialogRef = this.dialog.open(EnableJobDialogComponent, config);
        dialogRef.componentInstance.jobId = this.job.id;
        dialogRef.afterClosed().subscribe((obj) => {
            this.refresh();
        });
    }

    public get totalTasks(): number {
        return this.activeTasks + this.runningTasks + this.completedTasks;
    }

    public get completedTasksPercent(): number {
        const pct = this.completedTasks * 100 / this.totalTasks;
        return pct;
    }

    public get runningTasksPercent(): number {
        const pct = this.runningTasks * 100 / this.totalTasks;
        return pct + this.completedTasksPercent;
    }

    public resizePool(){
        console.log("resize pool!");
    }
}
