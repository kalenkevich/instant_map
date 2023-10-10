import {GlideMap} from '../map';

export interface PositionAnimationOptions {
	durationInSec?: number;
	easeLinearity?: number;
}

export const easeOut = (t: number, power: number): number => {
	return 1 - Math.pow(1 - t, power);
};

export type AnimationStep = (progress: number) => void;

export class EasyAnimation {
	private inProgress: boolean = false; 
	private startTime: number;
	private durationInSec: number;
	private easeOutPower: number;
	
  constructor(
		private readonly map: GlideMap, 
		private animationStep: AnimationStep,
		animationOptions: PositionAnimationOptions,
	) {
		this.durationInSec = animationOptions.durationInSec || 1;
		this.easeOutPower = 1 / Math.max(animationOptions.easeLinearity || 0.5, 0.2);
	}

	run(): void {
		this.startTime = +new Date();

		return this.startAnimation();
	}

	startAnimation(): void {
		if (this.inProgress) {
			this.stopAnimation();
		}

		return this.step();
	}

	step() {
		const elapsed = (+new Date()) - this.startTime;
		const durationInMs = this.durationInSec * 1000;

		requestAnimationFrame(() => {
			if (elapsed < durationInMs) {
				this.animationStep(easeOut(elapsed / durationInMs, this.easeOutPower));
				this.step();
	
				return;
			}
	
			this.animationStep(1);
			this.complete();
		});
	}

	complete() {
		this.inProgress = false;
	}

	stopAnimation(): void {
		if (!this.inProgress) {
			return;
		}

		this.map.stopRender();
	}
}
