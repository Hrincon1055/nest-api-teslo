import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeleteResult, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { ProductImage, Product } from './entities';
@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly dataSource: DataSource,
  ) {}
  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails } = createProductDto;
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map((image) =>
          this.productImageRepository.create({ url: image }),
        ),
      });
      await this.productRepository.save(product);
      return { ...product, images: images };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    try {
      const products = await this.productRepository.find({
        take: limit,
        skip: offset,
        relations: {
          images: true,
        },
      });
      return products.map((product) => ({
        ...product,
        images: product.images.map((img) => img.url),
      }));
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findOne(termino: string): Promise<Product> {
    let product: Product;
    if (isUUID(termino)) {
      product = await this.productRepository.findOneBy({ id: termino });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('product');
      product = await queryBuilder
        .where(`UPPER(title) =:title or slug =:slug`, {
          title: termino.toUpperCase(),
          slug: termino.toLocaleLowerCase(),
        })
        .leftJoinAndSelect('product.images', 'productImages')
        .getOne();
    }
    if (!product)
      throw new NotFoundException(`Product whit id ${termino} not found.`);
    return product;
  }
  async findOnePlain(termino: string) {
    const { images, ...productDetails } = await this.findOne(termino);
    return { ...productDetails, images: images.map((image) => image.url) };
  }
  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...productUpdateDetails } = updateProductDto;
    const product = await this.productRepository.preload({
      id,
      ...productUpdateDetails,
    });
    if (!product)
      throw new NotFoundException(`Product whit id ${id} not found.`);
    // create query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        product.images = images.map((image) =>
          this.productImageRepository.create({ url: image }),
        );
      } else {
      }
      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return this.findOnePlain(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleDBExceptions(error);
    }
  }
  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
  async deleteAllProducts(): Promise<DeleteResult> {
    const query = this.productRepository.createQueryBuilder('product');
    try {
      return await query.delete().where({}).execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
  private handleDBExceptions(error: any): void {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, checkserver logs',
    );
  }
}
