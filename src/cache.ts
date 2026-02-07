import { createClient } from 'redis';

export class Cache {
    private redis: ReturnType<typeof createClient>;
    private constructor(redis: any) {
        this.redis = redis;
    }

    public static async connect(dsn: string): Promise<Cache> {
        const redis = await createClient({
            url: `redis://${dsn}`,
        }).connect();
        return new Cache(redis);
    }

    public async set(key: string, value: string) {
        await this.redis.set(key, value)
    }

    public async get(key: string): Promise<string | null> {
        return await this.redis.get(key)
    }
}