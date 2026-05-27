"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ArrowRight, Shield, Truck, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [womensProducts, setWomensProducts] = useState<any[]>([]);
  const [mensProducts, setMensProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [womensLoading, setWomensLoading] = useState(true);
  const [mensLoading, setMensLoading] = useState(true);

  // Carousel State
  const heroImages = [
    "/hero-banner.jpg",
    "/hero-banner1.jpg",
    "/hero-banner2.jpg",
    "/hero-banner3.jpg",
    "/hero-banner4.jpg",
    "/hero-banner5.jpg",
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-play interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000); // 5000ms interval
    return () => clearInterval(timer);
  }, [heroImages.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured products (latest 8 products)
        const productsResponse = await fetch("/api/products?limit=8&sortBy=createdAt&sortOrder=desc");
        const productsData = await productsResponse.json();
        if (productsData.success) {
          setFeaturedProducts(productsData.data.products);
        }

        // Fetch parent categories only
        const categoriesResponse = await fetch("/api/categories?parentId=null");
        const categoriesData = await categoriesResponse.json();
        let allCategories: Category[] = [];
        if (categoriesData.success && categoriesData.data.categories) {
          allCategories = categoriesData.data.categories;
          setCategories(allCategories.slice(0, 6)); // Show first 6 active categories
        }

        // Fetch products for Women's wear
        const womensCategory = allCategories.find(c => c.slug === "womens-clothing");
        if (womensCategory) {
          const womensResponse = await fetch(`/api/products?categoryId=${womensCategory.id}&limit=4`);
          const womensData = await womensResponse.json();
          if (womensData.success) {
            setWomensProducts(womensData.data.products);
          }
        }
        setWomensLoading(false);

        // Fetch products for Men's wear
        const mensCategory = allCategories.find(c => c.slug === "mens-clothing");
        if (mensCategory) {
          const mensResponse = await fetch(`/api/products?categoryId=${mensCategory.id}&limit=4`);
          const mensData = await mensResponse.json();
          if (mensData.success) {
            setMensProducts(mensData.data.products);
          }
        }
        setMensLoading(false);
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[300px] md:h-[400px] overflow-hidden group bg-slate-900">
        {heroImages.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentSlide === index ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
          >
            <Image
              src={src}
              alt={`Try Me Hero Banner ${index + 1}`}
              fill
              sizes="100vw"
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-black/45" />
          </div>
        ))}

        <div className="container relative z-20 h-full flex flex-col items-center justify-center text-center px-4 md:px-6 pointer-events-none">
          <h1 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6 text-[#FF6600] pointer-events-auto">
            Welcome to TryMe
          </h1>
          <p className="text-base md:text-xl text-white/85 mb-6 md:mb-8 max-w-2xl mx-auto pointer-events-auto">
            Sri Lanka&apos;s premier multi-vendor e-commerce platform. Shop from
            trusted vendors with secure escrow payments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto -mt-3 md:mt-0 pb-4 md:pb-0">
            <Button size="lg" className="bg-[#FF6600] hover:bg-[#E65C00] text-white border-none transition-colors duration-200" asChild>
              <Link href="/products">
                Browse Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Manual Navigation Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-30 focus:outline-none"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-30 focus:outline-none"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        {/* Pagination Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-colors ${currentSlide === index ? "bg-primary" : "bg-white/50 hover:bg-white/80"
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-10 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between gap-2 mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold leading-none">Shop by Category</h2>
            <Button variant="ghost" asChild>
              <Link href="/categories">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group relative"
                >
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-2">
                    {category.image ? (
                      <>
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-4 left-4 right-4 text-white">
                            <span className="text-sm font-medium px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                              Explore
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-muted/30">
                        {category.name}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 md:mt-4 text-center">
                    <p className="text-sm md:text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                      {category.name}
                    </p>
                    <p className="hidden md:block text-sm text-muted-foreground mt-1">
                      Shop the latest in {category.name.toLowerCase()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-10 md:py-16 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between gap-2 mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold leading-none">Latest Products</h2>
            <Button variant="ghost" asChild>
              <Link href="/products">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <ProductGrid products={featuredProducts} />
          )}
        </div>
      </section>

      {/* Women's Wear Section */}
      <section className="py-10 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col mb-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">WOMEN&apos;S WEAR</h2>
            <p className="text-muted-foreground max-w-2xl mb-4">
              Elevate your style with our latest women&apos;s fashion. Shop chic and trendy pieces now!
            </p>
            <Link href="/categories/womens-clothing" className="text-blue-600 hover:underline inline-flex items-center text-sm font-medium">
              View All
            </Link>
          </div>
          {womensLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <ProductGrid products={womensProducts} />
          )}
        </div>
      </section>

      {/* Men's Wear Section */}
      <section className="py-10 md:py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col mb-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">MEN&apos;S WEAR</h2>
            <p className="text-muted-foreground max-w-2xl mb-4">
              Upgrade your wardrobe with our newest men&apos;s fashion. Shop stylish and modern pieces today!
            </p>
            <Link href="/categories/mens-clothing" className="text-blue-600 hover:underline inline-flex items-center text-sm font-medium">
              View All
            </Link>
          </div>
          {mensLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <ProductGrid products={mensProducts} />
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
            Why Shop With Us?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Shield}
              title="Secure Payments"
              description="All payments processed through secure escrow system with PayHere integration."
            />
            <FeatureCard
              icon={Truck}
              title="Fast Delivery"
              description="Quick shipping from trusted vendors across Sri Lanka."
            />
            <FeatureCard
              icon={CreditCard}
              title="Easy Returns"
              description="24-hour return policy for your peace of mind."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted py-10 md:py-16">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers shopping on TryMe. Create
            an account today and get started.
          </p>
          <Button size="lg" className="bg-[#FF6600] hover:bg-[#E65C00] text-white border-none transition-colors duration-200" asChild>
            <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </section>

      {/* Portal Links (for development) */}
      <section className="py-12 border-t">
        <div className="container px-4 md:px-6">
          <h3 className="text-xl font-semibold mb-6 text-center">Quick Access</h3>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/login">Customer Login</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/staff/login">Staff Login</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
