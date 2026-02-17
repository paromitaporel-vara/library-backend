import { Test, TestingModule } from '@nestjs/testing';
import { BorrowsController } from './borrows.controller';

describe('BorrowsController', () => {
  let controller: BorrowsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BorrowsController],
    }).compile();

    controller = module.get<BorrowsController>(BorrowsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
