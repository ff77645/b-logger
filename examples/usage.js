import { Logger, LogLevel } from '../dist/logger.js';
// 初始化日志器（默认DEBUG级别）
const logger = new Logger();
// 测试不同级别日志
// logger.debug('调试信息', { module: 'auth' });
// logger.info('用户登录', { userId: 123 });
// logger.warn('缓存即将过期', { remaining: 5 });
// logger.error('API请求失败', { url: '/api/data', status: 500 });
// 设置日志级别为WARN
// const productionLogger = new Logger(LogLevel.WARN);
// productionLogger.info('这条信息不应该被记录'); // 不会被存储
// productionLogger.warn('内存使用过高', { usage: '90%' });


document.getElementById('export_csv')?.addEventListener('click', () => {
    logger.export('csv', new Date('2023-01-01'), new Date(), LogLevel.INFO);
});
document.getElementById('export_json')?.addEventListener('click', () => {
    logger.export('json', new Date('2023-01-01'), new Date(), LogLevel.INFO);
});


document.getElementById('get_logs')?.addEventListener('click', async () => {
    const logs = await logger.getLogs(new Date('2023-01-01'), new Date(), LogLevel.DEBUG);
    console.log({logs});
});


document.getElementById('add_logs').addEventListener('click',async ()=>{
    // const res = await logger.debug('调试信息', { module: 'auth' });
    // console.log({res});
    
    await logger.info('用户登录', { userId: 123 });
    setTimeout(async ()=>{
        const logs = await logger.getLogs(new Date('2023-01-01'), new Date(), LogLevel.DEBUG);
        console.log({logs});
    },500)
})