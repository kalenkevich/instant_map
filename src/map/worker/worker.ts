import { WorkerActionHandler } from './worker_actions_handler';
import { TILE_RENDERER_SOURCE_PROCESSOR_CONFIG_MAP } from '../tile_renderer_config';

const workerActionHandler = new WorkerActionHandler(TILE_RENDERER_SOURCE_PROCESSOR_CONFIG_MAP);

workerActionHandler.listen();
