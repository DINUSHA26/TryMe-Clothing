import { prisma } from "@/lib/prisma";

/**
 * Given a category ID, returns an array containing that ID and all its descendant IDs.
 * Implements a recursive fetch to handle any depth of the category tree.
 */
export async function getCategoryFamily(categoryId: string | undefined): Promise<string[] | undefined> {
    if (!categoryId) return undefined;

    const family: string[] = [categoryId];

    // Using a queue for BFS to fetch all descendants
    let queue = [categoryId];

    while (queue.length > 0) {
        const parentIds = queue;
        queue = [];

        const children = await prisma.category.findMany({
            where: { parentId: { in: parentIds } },
            select: { id: true },
        });

        if (children.length > 0) {
            const childIds = children.map(c => c.id);
            family.push(...childIds);
            queue.push(...childIds);
        }
    }

    return family;
}
