import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { DataSource, Repository } from 'typeorm';
import { validate as isUUID } from 'uuid';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductImage } from './entities';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const { images = [], ...productDetails } = createProductDto;
    try {
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map((image) =>
          this.productImageRepository.create({ url: image }),
        ),
      });
      await this.productRepository.save(product);

      return { ...product, images };
    } catch (error) {
      this.handleDBException(error);
    }
  }

  // TODO: Paginar
  async findAll(paginationDto: PaginationDto) {
    try {
      const { limit = 10, offset = 0 } = paginationDto;
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
      this.handleDBException(error);
    }
  }

  async findOne(term: string) {
    let product: Product;
    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      //en los parentesis va un alias de la tabla
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
        //? los ':' del primer parametro del where deben estar junto al parametro no se puede colocar : parametro
        .where(`UPPER(title) = :title or slug = :slug`, {
          title: term.toUpperCase(),
          slug: term.toLocaleLowerCase(),
        })
        .leftJoinAndSelect('product.images', 'prodImages') //se usa en QueryBuilder para cargar las relaciones
        .getOne();
    }
    if (!product) {
      throw new NotFoundException(
        `El producto con el siguiente termino: ${term} no existe `,
      );
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({
      id,
      ...toUpdate,
    });
    if (!product) {
      throw new NotFoundException(
        `El producto con el siguiente id: ${id} no existe `,
      );
    }
    //Creando query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (images) {
        //podriamos usar el this.productRepository.delete(id) pero vamos a continuar
        // el proceso con queryRunner
        await queryRunner.manager.delete(ProductImage, { product: { id } });

        product.images = images.map((image) =>
          this.productImageRepository.create({ url: image }),
        );
      }

      await queryRunner.manager.save(product);

      // await this.productRepository.save(product);
      await queryRunner.commitTransaction();
      //recuerda que hasta se realice un commitTransaction no hemos afectado a la base
      await queryRunner.release();

      return product;
    } catch (error) {
      // revierte los cambios en la base de datos
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBException(error);
    }
  }

  async remove(id: string) {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(
        `El producto con el siguiente id: ${id} no existe `,
      );
    }
    await this.productRepository.delete(id);
    return {
      msg: `El producto con el siguiente #${id} fue eliminado correctamente`,
    };
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');
    try {
      await query.delete().where({}).execute();
      return {
        msg: 'Todos los productos fueron eliminados correctamente',
      };
    } catch (error) {
      this.handleDBException(error);
    }
  }

  private handleDBException(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
