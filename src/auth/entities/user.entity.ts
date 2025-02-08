import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Review } from '../../reviews/entities/review.entity';
import { Like } from '../../likes/entities/like.entity';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { Product } from 'src/products/entities/product.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude() // 응답에서 패스워드 필드 제외
  password: string;

  @Column({ unique: true })
  nickname: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 리뷰와의 1:N 관계 설정
  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  // 좋아요와의 1:N 관계 설정
  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  // 패스워드 해싱을 위한 훅
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // 패스워드가 변경되었을 때만 해싱
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // 패스워드 검증 메서드
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  @OneToMany(() => Product, (product) => product.user_id)
  products: Product[];
}
