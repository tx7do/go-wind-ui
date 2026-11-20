import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const dateUtil = dayjs;

// 统一以上海时区展示时间。setDefault 只影响 dayjs.tz(input) 省略时区参数时的默认值；
// 解析仍走 dayjs(input)（尊重串内偏移 / naive 按浏览器本地），随后 .tz(DEFAULT_TZ)
// 把同一绝对时刻换算成上海挂钟——时刻不变、展示统一，跨时区客户端不漂移。
const DEFAULT_TZ = 'Asia/Shanghai';
dayjs.tz.setDefault(DEFAULT_TZ);
dateUtil.tz.setDefault(DEFAULT_TZ);

export { dateUtil };

export function formatDate(time: number | string | Date, format = 'YYYY-MM-DD') {
  if (time === null || time === undefined || time === '') {
    return '';
  }

  try {
    // 先按输入原义解析，再 .tz() 换算展示时区。
    // 不能用 dateUtil.tz(time, ...) 直接解析：tz 的字符串分支把挂钟数字一律
    // 当目标时区的本地时间重新解释，ISO 串里的 Z/+08:00 偏移会被丢弃
    // （'2026-08-06T12:00:00Z' 会被显示成上海 12:00，实际应为上海 20:00）。
    const date = dateUtil(time).tz(DEFAULT_TZ);
    if (!date.isValid()) {
      // throw new Error('Invalid date');
      return '';
    }
    return date.format(format);
  } catch (error) {
    console.error(`Error formatting date: ${error}`);
    return time as string;
  }
}

export function formatDateTime(time: number | string | Date) {
  if (time === null || time === undefined || time === '') {
    return '';
  }
  return formatDate(time, 'YYYY-MM-DD HH:mm:ss');
}

export function isDate(value: any): value is Date {
  return value instanceof Date;
}

export function isDayjsObject(value: any): value is dayjs.Dayjs {
  return dateUtil.isDayjs(value);
}
