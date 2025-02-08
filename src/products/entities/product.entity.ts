// src/products/entities/product.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductOption } from './product-option.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Like } from '../../likes/entities/like.entity';
import { User } from 'src/auth/entities/user.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column()
  brand: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0 })
  likeCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ProductOption, (option) => option.product)
  options: ProductOption[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @OneToMany(() => Like, (like) => like.product)
  likes: Like[];

  @ManyToOne(() => User, (user) => user.products)
  @JoinColumn({ name: 'user_id' }) // 외래 키 컬럼 이름
  user_id: User;
}
