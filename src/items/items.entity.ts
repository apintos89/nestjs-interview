import { TodoList } from '../todo_lists/todo_list.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity()
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  todoListId: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  status: string;

  @ManyToOne(() => TodoList, (todoList) => todoList.items, {
    onDelete: 'CASCADE',
  })
  todoList: TodoList;
}
