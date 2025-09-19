import { Module } from '@nestjs/common';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';
import { DatabaseService } from './database.service';
import { AsyncWorkerService } from './async-worker.service';

@Module({
  imports: [],
  controllers: [IngestController],
  providers: [IngestService, DatabaseService, AsyncWorkerService],
})
export class AppModule {}
