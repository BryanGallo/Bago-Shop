import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {
  constructor(private readonly productsService: ProductsService) {}

  async runSeed() {
    const products = await this.insertNewProducts();

    if (products) {
      return 'SEED EXECUTED';
    }
  }

  private async insertNewProducts() {
    await this.productsService.deleteAllProducts();
    const products = initialData.products;

    const insertPromises = [];

    products.forEach(async (product) => {
      insertPromises.push(this.productsService.create(product));
    });

    await Promise.all(insertPromises);
    return true;
  }
}
