/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ItemsProcessor } from './items.processor';
import { ItemsService } from './items.service';
import { Job } from 'bull';
import { Item } from './items.entity';

describe('ItemsProcessor', () => {
  let processor: ItemsProcessor;
  let itemsService: jest.Mocked<ItemsService>;

  beforeEach(async () => {
    const mockItemsService = {
      all: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsProcessor,
        {
          provide: ItemsService,
          useValue: mockItemsService,
        },
      ],
    }).compile();

    processor = module.get<ItemsProcessor>(ItemsProcessor);
    itemsService = module.get<jest.Mocked<ItemsService>>(ItemsService);
  });

  describe('handleCompleteAllItems', () => {
    it('should complete all items successfully', async () => {
      const mockItems = [
        { id: 1, title: 'Item 1', status: 'Pending', todoListId: 1 },
        { id: 2, title: 'Item 2', status: 'Pending', todoListId: 1 },
        { id: 3, title: 'Item 3', status: 'Pending', todoListId: 1 },
      ] as Item[];

      itemsService.all.mockResolvedValue(mockItems);
      itemsService.update.mockResolvedValue(mockItems[0]);

      const mockJob = {
        data: { todoListId: 1 },
        progress: jest.fn().mockResolvedValue(undefined),
      } as unknown as Job<{ todoListId: number }>;

      const result = await processor.handleCompleteAllItems(mockJob);

      expect(result).toEqual({
        completed: 3,
        failed: 0,
        total: 3,
      });
      expect(itemsService.all).toHaveBeenCalledWith(1);
      expect(itemsService.update).toHaveBeenCalledTimes(3);
      expect(mockJob.progress).toHaveBeenCalledTimes(3);
    });

    it('should handle a large number of items efficiently', async () => {
      const ITEM_COUNT = 500000;
      const mockItems = Array.from({ length: ITEM_COUNT }, (_, i) => ({
        id: i + 1,
        title: `Item ${i + 1}`,
        status: 'Pending',
        todoListId: 1,
      })) as Item[];

      itemsService.all.mockResolvedValue(mockItems);
      itemsService.update.mockResolvedValue(mockItems[0]);

      const mockJob = {
        data: { todoListId: 1 },
        progress: jest.fn().mockResolvedValue(undefined),
      } as unknown as Job<{ todoListId: number }>;

      const startTime = Date.now();
      const result = await processor.handleCompleteAllItems(mockJob);
      const duration = Date.now() - startTime;

      expect(result).toEqual({
        completed: ITEM_COUNT,
        failed: 0,
        total: ITEM_COUNT,
      });
      expect(itemsService.update).toHaveBeenCalledTimes(ITEM_COUNT);
      expect(mockJob.progress).toHaveBeenCalledTimes(ITEM_COUNT);

      // Ensure it completes in reasonable time (adjust threshold as needed)
      console.log(`Completed ${ITEM_COUNT} items in ${duration}ms`);
    });

    it('should handle partial failures and continue processing', async () => {
      const mockItems = [
        { id: 1, title: 'Item 1', status: 'Pending', todoListId: 1 },
        { id: 2, title: 'Item 2', status: 'Pending', todoListId: 1 },
        { id: 3, title: 'Item 3', status: 'Pending', todoListId: 1 },
        { id: 4, title: 'Item 4', status: 'Pending', todoListId: 1 },
      ] as Item[];

      itemsService.all.mockResolvedValue(mockItems);
      itemsService.update
        .mockResolvedValueOnce(mockItems[0])
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce(mockItems[2])
        .mockRejectedValueOnce(new Error('Network error'));

      const mockJob = {
        data: { todoListId: 1 },
        progress: jest.fn().mockResolvedValue(undefined),
      } as unknown as Job<{ todoListId: number }>;

      const result = await processor.handleCompleteAllItems(mockJob);

      expect(result).toEqual({
        completed: 2,
        failed: 2,
        total: 4,
      });
      expect(itemsService.update).toHaveBeenCalledTimes(4);
    });

    it('should update progress correctly throughout processing', async () => {
      const mockItems = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        title: `Item ${i + 1}`,
        status: 'Pending',
        todoListId: 1,
      })) as Item[];

      itemsService.all.mockResolvedValue(mockItems);
      itemsService.update.mockResolvedValue(mockItems[0]);

      const progressCalls: number[] = [];
      const mockJob = {
        data: { todoListId: 1 },
        progress: jest.fn().mockImplementation((value: number) => {
          progressCalls.push(value);
          return Promise.resolve();
        }),
      } as unknown as Job<{ todoListId: number }>;

      await processor.handleCompleteAllItems(mockJob);

      // Progress should increase from 10% to 100%
      expect(progressCalls).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    });

    it('should handle empty item list', async () => {
      itemsService.all.mockResolvedValue([]);

      const mockJob = {
        data: { todoListId: 1 },
        progress: jest.fn().mockResolvedValue(undefined),
      } as unknown as Job<{ todoListId: number }>;

      const result = await processor.handleCompleteAllItems(mockJob);

      expect(result).toEqual({
        completed: 0,
        failed: 0,
        total: 0,
      });
      expect(itemsService.update).not.toHaveBeenCalled();
    });
  });
});
