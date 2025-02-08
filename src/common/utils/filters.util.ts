export class FilterUtils {
  static parseSort(sort: string): { [key: string]: 'ASC' | 'DESC' } {
    if (!sort) return {};

    const [field, order] = sort.split('_');
    return {
      [field]: order.toUpperCase() as 'ASC' | 'DESC',
    };
  }

  static parsePagination(page = 1, limit = 10) {
    const take = limit;
    const skip = (page - 1) * take;

    return { take, skip };
  }
}

// src/common/utils/response.util.ts
export class ResponseUtils {
  static success<T>(data: T, message = '성공적으로 처리되었습니다.') {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message = '처리 중 오류가 발생했습니다.') {
    return {
      success: false,
      message,
      data: null,
    };
  }
}
