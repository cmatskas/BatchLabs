import { NgModule } from "@angular/core";

import { commonModules } from "app/common";
import { FileBrowseModule } from "app/components/file/browse";
import { FileDetailsModule } from "app/components/file/details";
import { TaskBrowseModule } from "app/components/task/browse";

import { JobErrorDisplayComponent } from "./error-display";
import { JobDetailsHomeComponent } from "./job-details-home.component";
import { JobDetailsComponent } from "./job-details.component";
import { JobPropertiesComponent } from "./job-properties.component";

const components = [
    JobErrorDisplayComponent,
    JobDetailsHomeComponent,
    JobDetailsComponent,
    JobPropertiesComponent,
];

@NgModule({
    declarations: components,
    exports: components,
    imports: [...commonModules,
        FileBrowseModule, FileDetailsModule, TaskBrowseModule],
})
export class JobDetailsModule {
}
