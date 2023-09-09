import {GlideMap} from '../map';
import { Point } from '../geometry/point.js';

export interface PositionAnimationOptions {
	durationInSec?: number;
	easeLinearity?: number;
}

export const easeOut = (t: number, power: number): number => {
	return 1 - Math.pow(1 - t, power);
};

export class PositionAnimation {
	private inProgress: boolean = false; 
	private startTime: number;
	private durationInSec: number;
	private easeOutPower: number;
	
  constructor(
		private readonly map: GlideMap, 
		private readonly startPosition: Point,
		private readonly offset: Point,
		animationOptions: PositionAnimationOptions,
	) {
		this.durationInSec = animationOptions.durationInSec || 0.250;
		this.easeOutPower = 1 / Math.max(animationOptions.easeLinearity || 0.5, 0.2);
	}

	run(): Promise<void> {
		this.startTime = +new Date();

		return this.startAnimation();
	}

	startAnimation(): Promise<void> {
		if (this.inProgress) {
			return this.stopAnimation().then(() => this.step());
		}

		return this.step();
	}

	step(shouldRound?: boolean): Promise<void> {
		const elapsed = (+new Date()) - this.startTime;
		const durationInMs = this.durationInSec * 1000;

		if (elapsed < durationInMs) {
			return this.runFrame(easeOut(elapsed / durationInMs, this.easeOutPower), shouldRound);
		}

		return this.runFrame(1).then(() => this.complete());
	}

	runFrame(progress: number, shouldRound?: boolean): Promise<void> {
		const nextPosition = this.startPosition.add(this.offset.multiplyBy(progress));

		if (shouldRound) {
			nextPosition.round();
		}

		return this.map.setCenter(nextPosition);
	}

	complete() {
		this.inProgress = false;
	}

	stopAnimation(): Promise<void> {
		if (!this.inProgress) {
			return;
		}

		return this.map.stopRender();
	}
}
