import { Injectable } from '@nestjs/common';
import { CreateItemInTodoListDto } from './dtos/create-item';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './items.entity';
import { UpdateItemDto } from './dtos/update-item';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,
  ) {}

  async all(todoListId: number): Promise<Item[]> {
    return await this.itemsRepository.find({
      where: { todoListId },
      order: { status: 'DESC', title: 'ASC' },
    });
  }

  async get(id: number): Promise<Item | null> {
    return await this.itemsRepository.findOneBy({ id });
  }

  async create(dto: CreateItemInTodoListDto): Promise<Item> {
    const item = this.itemsRepository.create({
      title: dto.title,
      status: dto.status,
      description: dto.description,
      todoListId: dto.todoListId,
    });
    return await this.itemsRepository.save(item);
  }

  async update(id: number, dto: UpdateItemDto): Promise<Item> {
    await this.itemsRepository.update(id, dto);
    return (await this.itemsRepository.findOneBy({ id })) as Item;
  }

  async delete(id: number): Promise<void> {
    await this.itemsRepository.delete(id);
  }
}
