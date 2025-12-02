export class CreateItemDto {
  title: string;
  status: string;
}

export class CreateItemInTodoListDto {
  todoListId: number;
  title: string;
  status: string;
  description?: string;
}
