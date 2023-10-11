import { Point } from "../geometry/point";
import { MapControl } from "./map_control";
import { throttle } from "../utils/trottle";

export class CompassControl extends MapControl {
    private parentEl: HTMLElement;
    private innerEl: HTMLElement;
    private arrowUp: HTMLElement;
    private arrowDown: HTMLElement;
    private nLabel: HTMLElement;
    private sLabel: HTMLElement;
    private wLabel: HTMLElement;
    private eLabel: HTMLElement;
    private rotationDegree = 0;

    public init(): void {
        this.onNClick = this.onNClick.bind(this);
        this.onEClick = this.onEClick.bind(this);
        this.onSClick = this.onSClick.bind(this);
        this.onWClick = this.onWClick.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.parentEl = document.createElement('div');
        this.parentEl.style.position = 'relative';
        this.parentEl.style.cursor = 'grab';
        this.parentEl.style.width = '64px';
        this.parentEl.style.height = '64px';
        this.parentEl.style.borderRadius = '50%';
        this.parentEl.style.backgroundColor = '#ffffff';
        this.parentEl.style.border = '1px solid #ADB8D0';
        this.parentEl.style.margin = '0 5px 5px 0';
        this.parentEl.style.fontFamily = 'sans-serif';
        this.parentEl.addEventListener('mousedown', this.onMouseDown);

        this.innerEl = document.createElement('div');
        this.innerEl.style.position = 'absolute';
        this.innerEl.style.top = '50%';
        this.innerEl.style.left = '50%';
        this.innerEl.style.transform = `translate(-50%, -50%) rotate(${this.rotationDegree}deg)`;

        this.arrowUp = document.createElement('div');
        this.arrowUp.style.width = '0px';
        this.arrowUp.style.height = '0px';
        this.arrowUp.style.borderLeft = '4px solid transparent';
        this.arrowUp.style.borderRight = '4px solid transparent';
        this.arrowUp.style.borderBottom = '16px solid #f00';

        this.arrowDown = document.createElement('div');
        this.arrowDown.style.width = '0px';
        this.arrowDown.style.height = '0px';
        this.arrowDown.style.borderLeft = '4px solid transparent';
        this.arrowDown.style.borderRight = '4px solid transparent';
        this.arrowDown.style.borderTop = '16px solid #ADB8D0';

        this.nLabel = document.createElement('div');
        this.nLabel.style.position = 'absolute';
        this.nLabel.style.top = '2px';
        this.nLabel.style.left = 'calc(50% - 5px)';
        this.nLabel.style.fontSize = '14px';
        this.nLabel.style.cursor = 'pointer';
        this.nLabel.style.userSelect = 'none';
        this.nLabel.innerText = 'N';
        this.nLabel.addEventListener('click', this.onNClick);

        this.sLabel = document.createElement('div');
        this.sLabel.style.position = 'absolute';
        this.sLabel.style.bottom = '2px';
        this.sLabel.style.left = 'calc(50% - 5px)';
        this.sLabel.style.fontSize = '14px';
        this.sLabel.style.cursor = 'pointer';
        this.sLabel.style.userSelect = 'none';
        this.sLabel.innerText = 'S';
        this.sLabel.addEventListener('click', this.onSClick);

        this.wLabel = document.createElement('div');
        this.wLabel.style.position = 'absolute';
        this.wLabel.style.top = 'calc(50% - 5px)';
        this.wLabel.style.left = '2px';
        this.wLabel.style.fontSize = '14px';
        this.wLabel.style.cursor = 'pointer';
        this.wLabel.style.userSelect = 'none';
        this.wLabel.innerText = 'W';
        this.wLabel.addEventListener('click', this.onWClick);

        this.eLabel = document.createElement('div');
        this.eLabel.style.position = 'absolute';
        this.eLabel.style.top = 'calc(50% - 5px)';
        this.eLabel.style.right = '2px';
        this.eLabel.style.fontSize = '14px';
        this.eLabel.style.cursor = 'pointer';
        this.eLabel.style.userSelect = 'none';
        this.eLabel.innerText = 'E';
        this.eLabel.addEventListener('click', this.onEClick);

        this.innerEl.appendChild(this.arrowUp);
        this.innerEl.appendChild(this.arrowDown);

        this.parentEl.appendChild(this.innerEl);
        this.parentEl.appendChild(this.nLabel);
        this.parentEl.appendChild(this.sLabel);
        this.parentEl.appendChild(this.wLabel);
        this.parentEl.appendChild(this.eLabel);
    }

    public attach(rootEl: HTMLElement): void {
        rootEl.appendChild(this.parentEl);
    }
    
    public destroy(rootEl: HTMLElement): void {
        rootEl.removeChild(this.parentEl);
    }

    private onNClick(e: MouseEvent): void {
        e.stopPropagation();
        e.stopImmediatePropagation();

        this.setRotationDegree(0);
    }

    private onEClick(e: MouseEvent): void {
        e.stopPropagation();
        e.stopImmediatePropagation();

        this.setRotationDegree(90);
    }

    private onSClick(e: MouseEvent): void {
        e.stopPropagation();
        e.stopImmediatePropagation();

        this.setRotationDegree(180);
    }

    private onWClick(e: MouseEvent): void {
        e.stopPropagation();
        e.stopImmediatePropagation();

        this.setRotationDegree(270);
    }

    private mousePos?: Point;
    private onMouseDown(e: MouseEvent) {
        e.stopPropagation();
        e.stopImmediatePropagation();

        this.mousePos = new Point(e.pageX, e.pageY);
        this.updateCursor(true);

        window.addEventListener('mousemove', throttle(this.onMouseMove, 50));
        window.addEventListener('mouseup', this.onMouseUp);
    }

    private onMouseMove(e: MouseEvent) {
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (!this.mousePos) {
            return;
        }

        const nextMousePos = new Point(e.pageX, e.pageY);
        const degree = getDegree(this.mousePos, nextMousePos);

        this.setRotationDegree(degree);
    }

    private onMouseUp(e: MouseEvent) {
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (!this.mousePos) {
            return;
        }

        const nextMousePos = new Point(e.offsetX, e.offsetY);

        const degree = getDegree(this.mousePos, nextMousePos);
        this.setRotationDegree(degree);

        this.mousePos = null;
        this.updateCursor(false);

        window.removeEventListener('mousemove', throttle(this.onMouseMove, 50));
        window.removeEventListener('mouseup', this.onMouseUp);
    }

    private setRotationDegree(degree: number) {
        this.rotationDegree = degree;
        this.innerEl.style.transform = `translate(-50%, -50%) rotate(${this.rotationDegree}deg)`;
    }

    /** Adds global style for whole page to change cursor style to grabbing. */
    private styletag: HTMLElement;
    private updateCursor(dragInProgress: boolean) {
        this.parentEl.style.cursor = dragInProgress ? 'grabbing' : 'grab';

        if (dragInProgress) {
            const css = "* { cursor: grabbing !important; }";

            this.styletag = document.createElement("style");
            this.styletag.appendChild(document.createTextNode(css));

            document.body.appendChild(this.styletag);
        } else {
            this.styletag.remove();
        }
    }
}

export const getDegree = (p1: Point, p2: Point): number =>
    Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
