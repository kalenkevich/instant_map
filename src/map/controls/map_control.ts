import { GlideMap } from "../map";

export abstract class MapControl {
  constructor(
    protected readonly map: GlideMap,
  ) {}

  public abstract init(): void;

  public abstract attach(rootEl: HTMLElement): void;

  public abstract destroy(rootEl: HTMLElement): void;
}