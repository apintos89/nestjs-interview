import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './items.entity';
import { BullModule } from '@nestjs/bull';
import { ItemsProcessor } from './items.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item]),
    BullModule.registerQueue({
      name: 'items',
    }),
  ],
  controllers: [ItemsController],
  providers: [ItemsService, ItemsProcessor],
  exports: [ItemsService],
})
export class ItemsModule {}
