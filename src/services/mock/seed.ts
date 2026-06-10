/**
 * @fileoverview Mock seed data
 *
 * A domain-accurate snapshot mirroring the backend's `Database/seed.sql`
 * (Kiryat Motzkin schools, grades 9-12, an equipment catalog priced in ILS,
 * per-grade requirements, parent accounts and order history). Used by the
 * in-memory mock store so the admin panel is fully functional without a live
 * backend. `createSeed()` returns fresh copies so the store can be reset.
 */

// Internal record shapes — these mirror the database tables, not the API DTOs.
export interface SchoolRecord {
  id: string;
  name: string;
}
export interface GradeRecord {
  id: string;
  schoolId: string;
  name: string;
}
export interface EquipmentRecord {
  id: string;
  name: string;
  price: number;
}
export interface RequirementRecord {
  gradeId: string;
  equipmentId: string;
  quantity: number;
}
export interface ParentRecord {
  id: string;
  username: string;
  password: string;
}
export interface AdminRecord {
  userid: string;
  username: string;
  password: string;
  role: 'admin' | 'superadmin';
}
export interface OrderItemRecord {
  equipmentId: string;
  quantity: number;
  priceAtPurchase: number;
}
export interface OrderRecord {
  id: string;
  userId: string;
  gradeId: string;
  purchaseDate: string;
  items: OrderItemRecord[];
}
export interface CartRecord {
  userId: string;
  gradeId: string;
}

export interface MockDb {
  schools: SchoolRecord[];
  grades: GradeRecord[];
  equipment: EquipmentRecord[];
  requirements: RequirementRecord[];
  parents: ParentRecord[];
  orders: OrderRecord[];
  carts: CartRecord[];
}

/** Grade id scheme used by the backend: `sid * 10 + (gradeNumber - 8)`. */
function gradeId(schoolId: string, gradeNumber: number): string {
  return String(Number(schoolId) * 10 + (gradeNumber - 8));
}

const SCHOOL_NAMES: Record<string, string> = {
  '1': 'Ben Gurion',
  '2': 'ORT',
  '3': 'Brener',
  '4': 'Herzel',
  '5': 'Begin',
};

const GRADE_LABELS: Record<number, string> = {
  9: '9th Grade',
  10: '10th Grade',
  11: '11th Grade',
  12: '12th Grade',
};

/** Admin accounts allowed to sign in to this panel (matches backend seed). */
export const MOCK_ADMINS: AdminRecord[] = [
  { userid: '100', username: 'admin', password: '1234', role: 'superadmin' },
];

export function createSeed(): MockDb {
  const schools: SchoolRecord[] = Object.entries(SCHOOL_NAMES).map(
    ([id, name]) => ({ id, name }),
  );

  const grades: GradeRecord[] = [];
  for (const school of schools) {
    for (let n = 9; n <= 12; n++) {
      grades.push({
        id: gradeId(school.id, n),
        schoolId: school.id,
        name: GRADE_LABELS[n],
      });
    }
  }

  const equipment: EquipmentRecord[] = [
    { id: '1', name: 'Notebook', price: 5.0 },
    { id: '2', name: 'Pencil', price: 2.0 },
    { id: '3', name: 'Algebra Textbook', price: 35.5 },
    { id: '4', name: 'Physics Textbook', price: 35.0 },
    { id: '5', name: 'Laptop', price: 800.0 },
    { id: '6', name: 'Engineering Calculator', price: 60.0 },
    { id: '7', name: 'Binder', price: 4.0 },
    { id: '8', name: 'Highlighter', price: 2.0 },
  ];

  // Default list for every grade: binders + highlighters.
  const requirements: RequirementRecord[] = grades.flatMap((g) => [
    { gradeId: g.id, equipmentId: '7', quantity: 2 },
    { gradeId: g.id, equipmentId: '8', quantity: 4 },
  ]);

  // Specialised lists override the default for two grades.
  const override = (gid: string, items: RequirementRecord[]) => {
    for (let i = requirements.length - 1; i >= 0; i--) {
      if (requirements[i].gradeId === gid) requirements.splice(i, 1);
    }
    requirements.push(...items);
  };
  override(gradeId('1', 9), [
    { gradeId: gradeId('1', 9), equipmentId: '1', quantity: 2 },
    { gradeId: gradeId('1', 9), equipmentId: '2', quantity: 4 },
    { gradeId: gradeId('1', 9), equipmentId: '3', quantity: 1 },
  ]);
  override(gradeId('2', 12), [
    { gradeId: gradeId('2', 12), equipmentId: '5', quantity: 1 },
    { gradeId: gradeId('2', 12), equipmentId: '6', quantity: 1 },
    { gradeId: gradeId('2', 12), equipmentId: '4', quantity: 1 },
  ]);

  const parents: ParentRecord[] = [
    { id: '1', username: 'user1', password: '1234' },
    { id: '2', username: 'user2', password: '1234' },
    { id: '3', username: 'cohen_family', password: '1234' },
    { id: '4', username: 'levi_family', password: '1234' },
  ];

  const orders: OrderRecord[] = [
    {
      id: '1',
      userId: '1',
      gradeId: gradeId('1', 9),
      purchaseDate: '2026-01-10T09:30:00Z',
      items: [
        { equipmentId: '1', quantity: 2, priceAtPurchase: 5.0 },
        { equipmentId: '2', quantity: 4, priceAtPurchase: 2.0 },
        { equipmentId: '3', quantity: 1, priceAtPurchase: 35.5 },
      ],
    },
    {
      id: '2',
      userId: '1',
      gradeId: gradeId('1', 10),
      purchaseDate: '2026-03-22T14:05:00Z',
      items: [
        { equipmentId: '7', quantity: 2, priceAtPurchase: 4.0 },
        { equipmentId: '8', quantity: 4, priceAtPurchase: 2.0 },
      ],
    },
    {
      id: '3',
      userId: '2',
      gradeId: gradeId('2', 12),
      purchaseDate: '2026-04-15T11:20:00Z',
      items: [
        { equipmentId: '5', quantity: 1, priceAtPurchase: 800.0 },
        { equipmentId: '6', quantity: 1, priceAtPurchase: 60.0 },
        { equipmentId: '4', quantity: 1, priceAtPurchase: 35.0 },
      ],
    },
    {
      id: '4',
      userId: '3',
      gradeId: gradeId('3', 9),
      purchaseDate: '2026-02-05T08:45:00Z',
      items: [
        { equipmentId: '7', quantity: 2, priceAtPurchase: 4.0 },
        { equipmentId: '8', quantity: 4, priceAtPurchase: 2.0 },
      ],
    },
    {
      id: '5',
      userId: '4',
      gradeId: gradeId('4', 9),
      purchaseDate: '2026-05-18T16:10:00Z',
      items: [
        { equipmentId: '1', quantity: 3, priceAtPurchase: 5.0 },
        { equipmentId: '2', quantity: 2, priceAtPurchase: 2.0 },
      ],
    },
    {
      id: '6',
      userId: '2',
      gradeId: gradeId('2', 12),
      purchaseDate: '2026-06-01T10:00:00Z',
      items: [{ equipmentId: '5', quantity: 1, priceAtPurchase: 800.0 }],
    },
  ];

  const carts: CartRecord[] = [
    { userId: '1', gradeId: gradeId('1', 9) },
    { userId: '2', gradeId: gradeId('2', 12) },
  ];

  return { schools, grades, equipment, requirements, parents, orders, carts };
}
