import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { ItemsService } from './items.service';
import { ICompleteAllItemsResult } from 'src/interfaces/item.interface';

@Processor('items')
export class ItemsProcessor {
  constructor(private readonly itemsService: ItemsService) {}

  @Process('complete-all-items')
  async handleCompleteAllItems(
    job: Job<{ todoListId: number }>,
  ): Promise<ICompleteAllItemsResult> {
    const { todoListId } = job.data;

    const items = await this.itemsService.all(todoListId);

    let completed = 0;
    let failed = 0;

    for (const item of items) {
      console.log(`Completing item with ID ${item.id}...`, item);
      try {
        await this.itemsService.update(item.id, { status: 'Completed' });
        completed++;

        await job.progress(Math.floor((completed / items.length) * 100));
      } catch (error) {
        failed++;
        console.error(`Failed to complete item with ID ${item.id}:`, error);
      }
    }

    return { completed, failed, total: items.length };
  }
}
