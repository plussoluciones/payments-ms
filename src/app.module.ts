import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { HealthCheckController } from './health-check/health-check.controller';

@Module({
  imports: [PaymentsModule, HealthCheckController],
  controllers: [],
  providers: [],
})
export class AppModule {}
