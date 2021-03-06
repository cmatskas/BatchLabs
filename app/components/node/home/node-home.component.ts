import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";

import { SidebarManager } from "../../base/sidebar";

@Component({
    selector: "bl-node-home",
    templateUrl: "node-home.html",
})
export class NodeHomeComponent implements OnInit, OnDestroy {
    public poolId: string;

    private _paramsSubscriber: Subscription;

    constructor(
        private sidebarManager: SidebarManager,
        private activatedRoute: ActivatedRoute) {
    }

    public ngOnInit() {
        this._paramsSubscriber = this.activatedRoute.params.subscribe((params) => {
            this.poolId = params["poolId"];
        });
    }

    public ngOnDestroy() {
        this._paramsSubscriber.unsubscribe();
    }
}
