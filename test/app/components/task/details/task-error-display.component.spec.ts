import { Component, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { Observable } from "rxjs";

import { SidebarManager } from "app/components/base/sidebar";
import { TaskErrorDisplayComponent } from "app/components/task/details";
import { Task, TaskState } from "app/models";
import { TaskService } from "app/services";
import * as Fixtures from "test/fixture";
import { BannerMockComponent } from "test/utils/mocks/components";

@Component({
    template: `<bl-task-error-display jobId="job-1" [task]="task"></bl-task-error-display>`,
})
class TaskErrorDisplayMockComponent {
    public task: Task;
}

describe("TaskErrorDisplayComponent", () => {
    let fixture: ComponentFixture<TaskErrorDisplayMockComponent>;
    let testComponent: TaskErrorDisplayMockComponent;
    let component: TaskErrorDisplayComponent;
    let accountServiceSpy: any;

    beforeEach(() => {
        accountServiceSpy = {
            currentAccount: Observable.of(Fixtures.account.create()),
        };

        TestBed.configureTestingModule({
            declarations: [BannerMockComponent, TaskErrorDisplayComponent, TaskErrorDisplayMockComponent],
            providers: [
                { provide: SidebarManager, useValue: null },
                { provide: TaskService, useValue: null },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        });

        fixture = TestBed.createComponent(TaskErrorDisplayMockComponent);
        testComponent = fixture.componentInstance;
        component = fixture.debugElement.query(By.css("bl-task-error-display")).componentInstance;
        fixture.detectChanges();
    });

    describe("when there is no error", () => {
        it("should not show anything", () => {
            expect(fixture.debugElement.query(By.css("bl-banner"))).toBeNull();
        });
    });

    describe("when task return non zero exit code", () => {
        beforeEach(() => {
            testComponent.task = new Task({
                state: TaskState.completed,
                executionInfo: {
                    exitCode: 1,
                },
            });
            fixture.detectChanges();
        });

        it("should have a failure exit code error", () => {
            expect(component.hasCompleted).toBe(true);
            expect(component.hasFailureExitCode).toBe(true);
        });

        it("should show 1 bl banner", () => {
            expect(fixture.debugElement.queryAll(By.css("bl-banner")).length).toBe(1);
        });

        it("Should show the code and message", () => {
            const banner = fixture.debugElement.query(By.css("bl-banner"));
            expect(banner.nativeElement.textContent).toContain("Task completed with exit code '1'");
        });

        it("should propose increase quota as a first fix", () => {
            const banner = fixture.debugElement.query(By.css("bl-banner")).componentInstance;
            expect(banner.fixMessage).toContain("Rerun task");
        });
    });
});
