import { Page } from 'puppeteer';
import { MapEventType } from '../../../src/map/map';

export const goToPageAndWaitForMapRender = (
  p: any,
  url: string,
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
    }, MapEventType.RENDER);

    await page.goto(url);
  }).then(async () => await page.removeExposedFunction('onCustomEvent'));
};

export const waitForMapRender = (p: any, waitTimeout?: number) =>
  waitForEvent(p as Page, MapEventType.RENDER, waitTimeout);

export const waitForEvent = async (
  page: Page,
  eventType: string,
  waitTimeout: number = 5000,
) => {
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

    await page.evaluate(type => {
      document.addEventListener(type, e => {
        // @ts-ignore
        window.onCustomEvent({type, detail: e.detail});
      });
    }, eventType);
  }).then(async () => await page.removeExposedFunction('onCustomEvent'));
};