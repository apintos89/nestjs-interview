import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Item } from '../interfaces/item.interface';
import { CreateItemDto, CreateItemInTodoListDto } from './dtos/create-item';
import { ItemsService } from './items.service';
import { UpdateItemDto } from './dtos/update-item';

@Controller('api/todoLists/:todoListId/items')
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

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
}
