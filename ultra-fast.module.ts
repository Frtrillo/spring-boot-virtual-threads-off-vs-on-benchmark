import { Module } from '@nestjs/common';
import { UltraFastController } from './ultra-fast.controller';

@Module({
  controllers: [UltraFastController],
  providers: [], // No services, no DI overhead
})
export class UltraFastModule {}
