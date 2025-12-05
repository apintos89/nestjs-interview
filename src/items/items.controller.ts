import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ICompleteAllItemsResult, Item } from '../interfaces/item.interface';
import { CreateItemDto, CreateItemInTodoListDto } from './dtos/create-item';
import { ItemsService } from './items.service';
import { UpdateItemDto } from './dtos/update-item';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Controller('api/todoLists/:todoListId/items')
export class ItemsController {
  constructor(
    private itemsService: ItemsService,
    @InjectQueue('items') private itemQueue: Queue,
  ) {}

  @Get()
  getAllItems(@Param() param: { todoListId: number }): Promise<Item[]> {
    return this.itemsService.all(param.todoListId);
  }

  @Get('/:itemId')
  getItem(@Param() param: { itemId: number }): Promise<Item | null> {
    return this.itemsService.get(param.itemId);
  }

  @Post()
  createItem(
    @Param() param: { todoListId: number },
    @Body() dto: CreateItemDto,
  ): Promise<Item> {
    const itemInTodoListDto: CreateItemInTodoListDto = {
      ...dto,
      todoListId: param.todoListId,
    };
    return this.itemsService.create(itemInTodoListDto);
  }

  @Post('/completeAll')
  async completeAllItems(@Param() param: { todoListId: number }) {
    const job = await this.itemQueue.add('complete-all-items', {
      todoListId: param.todoListId,
    });

    return {
      jobId: job.id,
      message: 'Started completing all items',
      statusUrl: `job-status/${job.id}`,
    };
  }

  @Put('/:itemId')
  updateItem(
    @Param() param: { itemId: number },
    @Body() dto: UpdateItemDto,
  ): Promise<Item> {
    return this.itemsService.update(param.itemId, dto);
  }

  @Delete('/:itemId')
  deleteItem(@Param() param: { itemId: number }): Promise<void> {
    return this.itemsService.delete(param.itemId);
  }

  @Get('/job-status/:jobId')
  async getJobStatus(@Param() param: { jobId: string }) {
    const job = await this.itemQueue.getJob(param.jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const state = await job.getState();
    const progress: number = (await job.progress()) as number;
    const result: ICompleteAllItemsResult | null = !job.returnvalue
      ? null
      : (job.returnvalue as ICompleteAllItemsResult);

    return {
      id: job.id,
      state,
      progress,
      result: result,
    };
  }
}
