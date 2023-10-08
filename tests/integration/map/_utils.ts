import { Page } from 'puppeteer';
import { MapEventType } from '../../../src/map/map';

export const goToPageAndWaitForMapRender = (
  p: any,
  url: string,
  waitTimeout: number = 5000,
) => {
  const page = p as Page;

  return interactAndWaitForMapEvent(p, () => page.goto(url), MapEventType.RENDER, waitTimeout);
};

export const interactAndWaitForMapEvent = async (
  p: any,
  asyncFun: () => Promise<any>,
  eventType: string,
  waitTimeout: number = 5000,
) => {
  const page = p as Page;

  return new Promise<void>(async (resolve, reject) => {
    let rejected = false;
    let rejectedTimeoutId = setTimeout(() => {
      rejected = true;
      reject(new Error('Timeout exited.'));
    }, waitTimeout);

    await page.exposeFunction('onCustomEvent', () => {
      if (rejected) {
        return;
      }

      clearTimeout(rejectedTimeoutId);
      resolve();
    });

    await page.evaluateOnNewDocument(type => {
      document.addEventListener(type, e => {
        // @ts-ignore
        window.onCustomEvent({type, detail: e.detail});
      });
    }, eventType);

    await asyncFun();
  }).then(async () => await page.removeExposedFunction('onCustomEvent'));
};
