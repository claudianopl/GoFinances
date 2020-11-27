import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRespository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface RequestTDO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: RequestTDO): Promise<Transaction> {
    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Type not permitted.');
    }

    const transactionsRespository = getCustomRepository(
      TransactionsRespository,
    );
    const categoryRepository = getRepository(Category);

    const balance = await transactionsRespository.getBalance();

    if (type === 'outcome' && balance.total < value) {
      throw new AppError('You do not have enough balance.');
    }

    let categoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!categoryExists) {
      categoryExists = categoryRepository.create({ title: category });

      await categoryRepository.save(categoryExists);
    }

    const transaction = transactionsRespository.create({
      title,
      value,
      type,
      category_id: categoryExists.id,
    });

    await transactionsRespository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
