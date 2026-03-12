import ecommerceJson from './ecommerce.json?raw';
import blogJson from './blog.json?raw';
import f1Json from './f1-telemetry.json?raw';

export type Preset = {
  name: string;
  label: string;
  sql: string;
  json: string;
};

const ECOMMERCE_SQL = `CREATE TABLE users (
  id uuid PRIMARY KEY,
  email varchar(255) UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamp NOT NULL
);

CREATE TABLE categories (
  id uuid PRIMARY KEY,
  name varchar(100) UNIQUE NOT NULL,
  parent_category_id uuid REFERENCES categories(id)
);

CREATE TABLE products (
  id uuid PRIMARY KEY,
  name varchar(255) NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  category_id uuid REFERENCES categories(id),
  created_at timestamp NOT NULL
);

CREATE TABLE orders (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  status varchar(50) NOT NULL,
  total decimal(10,2) NOT NULL,
  created_at timestamp NOT NULL
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id),
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL
);

CREATE TABLE reviews (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  product_id uuid NOT NULL REFERENCES products(id),
  rating integer NOT NULL,
  body text,
  created_at timestamp NOT NULL
);`;

const BLOG_SQL = `CREATE TABLE authors (
  id uuid PRIMARY KEY,
  name varchar(255) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  bio text
);

CREATE TABLE posts (
  id uuid PRIMARY KEY,
  author_id uuid NOT NULL REFERENCES authors(id),
  title varchar(255) NOT NULL,
  body text NOT NULL,
  status varchar(20) NOT NULL,
  published_at timestamp,
  created_at timestamp NOT NULL
);

CREATE TABLE tags (
  id uuid PRIMARY KEY,
  name varchar(100) UNIQUE NOT NULL,
  slug varchar(100) UNIQUE NOT NULL
);

CREATE TABLE post_tags (
  post_id uuid REFERENCES posts(id),
  tag_id uuid REFERENCES tags(id),
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE comments (
  id uuid PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES posts(id),
  author_name varchar(255) NOT NULL,
  body text NOT NULL,
  created_at timestamp NOT NULL
);`;

const F1_SQL = `CREATE TABLE teams (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL,
  country varchar(100) NOT NULL,
  engine_supplier varchar(100) NOT NULL
);

CREATE TABLE drivers (
  id uuid PRIMARY KEY,
  name varchar(255) NOT NULL,
  number integer NOT NULL,
  team_id uuid NOT NULL REFERENCES teams(id)
);

CREATE TABLE circuits (
  id uuid PRIMARY KEY,
  name varchar(255) NOT NULL,
  country varchar(100) NOT NULL,
  length_km decimal(5,3) NOT NULL,
  num_turns integer NOT NULL
);

CREATE TABLE races (
  id uuid PRIMARY KEY,
  circuit_id uuid NOT NULL REFERENCES circuits(id),
  season integer NOT NULL,
  round integer NOT NULL,
  date date NOT NULL
);

CREATE TABLE race_results (
  id uuid PRIMARY KEY,
  race_id uuid NOT NULL REFERENCES races(id),
  driver_id uuid NOT NULL REFERENCES drivers(id),
  position integer NOT NULL,
  time_ms bigint,
  points decimal(4,1) NOT NULL,
  fastest_lap boolean NOT NULL
);

CREATE TABLE telemetry_samples (
  id uuid PRIMARY KEY,
  race_id uuid NOT NULL REFERENCES races(id),
  driver_id uuid NOT NULL REFERENCES drivers(id),
  lap integer NOT NULL,
  timestamp_ms bigint NOT NULL,
  speed_kph decimal(6,2) NOT NULL,
  throttle decimal(5,2) NOT NULL,
  brake decimal(5,2) NOT NULL,
  gear integer NOT NULL,
  rpm integer NOT NULL
);`;

export const PRESETS: Preset[] = [
  { name: 'ecommerce', label: 'Ecommerce', sql: ECOMMERCE_SQL, json: ecommerceJson },
  { name: 'blog', label: 'Blog', sql: BLOG_SQL, json: blogJson },
  { name: 'f1', label: 'F1 Telemetry', sql: F1_SQL, json: f1Json },
];
