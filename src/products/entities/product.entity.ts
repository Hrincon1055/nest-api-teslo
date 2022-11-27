import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ProductImage } from './';
import { User } from '../../auth/entities/user.entity';

@Entity({ name: 'products' })
export class Product {
  //-------DEFINICION DE COLUMNAS---------//
  @ApiProperty({
    example: 'adbcecb8-0439-4973-9bab-e9ca4af84af2',
    description: 'Product ID',
    uniqueItems: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ApiProperty({
    example: 'T-shit',
    description: 'Product tutle',
    uniqueItems: true,
  })
  @Column('text', { unique: true })
  title: string;
  @ApiProperty({
    example: 0,
    description: 'Product price',
  })
  @Column('float', { default: 0 })
  price: number;
  @ApiProperty({
    example: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    description: 'Product description',
    default: null,
  })
  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;
  @ApiProperty({
    example: 't_shit',
    description: 'Product slug - for SEO',
    uniqueItems: true,
  })
  @Column('text', { unique: true })
  slug: string;
  @ApiProperty({
    example: 10,
    description: 'Product stock',
    default: 0,
  })
  @Column('int', { default: 0 })
  stock: number;
  @ApiProperty({
    example: ['M', 'XL'],
    description: 'Product size',
  })
  @Column('text', {
    array: true,
  })
  sizes: string[];
  @ApiProperty({
    example: 'women',
    description: 'Product gender',
  })
  @Column('text')
  gender: string;
  @ApiProperty()
  @Column('text', { array: true, default: [] })
  tags: string[];
  @ApiProperty()
  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true,
    eager: true,
  })
  images?: ProductImage[];
  @ManyToOne(() => User, (user) => user.product, { eager: true })
  user: User;
  //-------DEFINICION DE COLUMNAS END---------//
  // FUNCIONES
  @BeforeInsert()
  checkInsertSlug() {
    if (!this.slug) {
      this.slug = this.title;
    }
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll('’', '');
  }
  @BeforeUpdate()
  checkUpdateSlug() {
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll('’', '');
  }
}
