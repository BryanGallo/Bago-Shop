import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', {
    unique: true,
  })
  title: string;

  //otra forma de especificar el tipo con type y usando un solo objeto
  @Column({
    type: 'float',
  })
  price: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  @Column({
    type: 'text',
    unique: true,
  })
  slug: string;

  @Column({ type: 'int' })
  stock: number;

  @Column({
    type: 'text',
    array: true, //Con esta opcion se vuelve un arreglo segun el tipo de dato
  })
  sizes: string[];

  @Column({
    type: 'text',
  })
  gender: string;
}
