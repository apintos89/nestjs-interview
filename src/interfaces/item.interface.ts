export interface Item {
  id: number;
  todoListId: number;
  title: string;
  status: string;
  description?: string;
}

export interface ICompleteAllItemsResult {
  completed: number;
  failed: number;
  total: number;
}
