import { SubtaskInformation, TaskState } from "app/models";
import { DecoratorBase } from "app/utils/decorators";
import { ComputeNodeInfoDecorator } from "./compute-node-info-decorator";
import { SchedulingErrorDecorator } from "./scheduling-error-decorator";

export class SubTaskDecorator extends DecoratorBase<SubtaskInformation> {
    public startTime: string;
    public endTime: string;
    public exitCode: string;
    public state: string;
    public stateTransitionTime: string;
    public stateIcon: string;
    public previousState: string;
    public previousStateTransitionTime: string;

    public nodeInfo: {};
    public schedulingError: {};

    constructor(private task?: SubtaskInformation) {
        super(task);

        this.startTime = this.dateField(task.startTime);
        this.endTime = this.dateField(task.endTime);
        this.exitCode = this.stringField(task.exitCode);
        this.state = this.stateField(task.state);
        this.stateTransitionTime = this.dateField(task.stateTransitionTime);
        this.stateIcon = this._getStateIcon(task.state);
        this.previousState = this.stateField(task.previousState);
        this.previousStateTransitionTime = this.dateField(task.previousStateTransitionTime);

        this.nodeInfo = new ComputeNodeInfoDecorator(task.nodeInfo || <any>{});
        this.schedulingError = new SchedulingErrorDecorator(task.schedulingError || <any>{});
    }

    // todo: base class ...
    private _getStateIcon(state: TaskState): string {
        switch (state) {
            case TaskState.preparing:
                return "fa-spinner";
            case TaskState.active:
            case TaskState.running:
                return "fa-cog";
            case TaskState.completed:
                return "fa-check-circle-o";
            default:
                return "fa-question-circle-o";
        }
    }
}
