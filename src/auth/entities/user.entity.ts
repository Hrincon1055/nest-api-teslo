import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('users')
export class User {
  //-------DEFINICION DE COLUMNAS---------//
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('text', { unique: true })
  email: string;
  @Column('text', { select: false })
  password: string;
  @Column('text')
  fullName: string;
  @Column('bool', { default: true })
  isActive: boolean;
  @Column('text', { array: true, default: ['user'] })
  roles: string[];
  @OneToMany(() => Product, (product) => product.user)
  product: Product;
  //-------DEFINICION DE COLUMNAS END---------//
  // FUNCIONES
  @BeforeInsert()
  checkFieldsBeforeInsert() {
    this.email = this.email.toLowerCase().trim();
  }
  @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    this.email = this.email.toLowerCase().trim();
  }
}
