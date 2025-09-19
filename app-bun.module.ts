import { Module } from '@nestjs/common';
import { IngestBunController } from './ingest-bun.controller';
import { IngestBunService } from './ingest-bun.service';
import { DatabaseBunService } from './database-bun.service';
import { AsyncWorkerService } from './async-worker.service';

@Module({
  imports: [],
  controllers: [IngestBunController],
  providers: [IngestBunService, DatabaseBunService, AsyncWorkerService],
})
export class AppBunModule {}
