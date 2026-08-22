import React from 'react';
import {View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions, StatusBar} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import type {RootState} from '../../redux/store';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=90&fit=crop';

const GRID_COLUMNS = 4;
const GRID_GAP = sw(12);
const GRID_ITEM_W = (width - sw(32) - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

const AllCategoriesScreen = ({navigation}: {navigation: any}) => {
  const insets = useSafeAreaInsets();
  const {categories} = useSelector((state: RootState) => state.Services);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCF8F3" />
      <View style={[styles.header, {paddingTop: insets.top + sw(10)}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={sw(22)} color="#012823" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Services</Text>
        <View style={{width: sw(28)}} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {categories.map((item: any) => (
            <TouchableOpacity
              key={item._id ?? item.id}
              style={styles.item}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ServiceListing', {categoryId: item._id ?? item.id, category: item.name})}>
              <View style={styles.imgBox}>
                <View style={styles.imgInner}>
                  <Image source={{uri: item.image ?? FALLBACK_IMAGE}} style={styles.img} resizeMode="cover" />
                </View>
              </View>
              <Text style={styles.label} numberOfLines={2}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#FCF8F3'},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: sw(16), paddingBottom: sw(12), backgroundColor: '#FCF8F3',
  },
  backBtn: {width: sw(28), height: sw(28), justifyContent: 'center', alignItems: 'center'},
  headerTitle: {fontFamily: 'PlayfairDisplay-Regular', fontSize: sw(18), color: '#171816'},
  scrollContent: {paddingHorizontal: sw(16), paddingTop: sw(8), paddingBottom: sw(32)},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, rowGap: sw(20)},
  item: {width: GRID_ITEM_W, alignItems: 'center', gap: sw(8)},
  imgBox: {
    width: GRID_ITEM_W, height: GRID_ITEM_W, borderRadius: sw(12.63),
    backgroundColor: '#F4E1CC',
    elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: sw(1)}, shadowOpacity: 0.05, shadowRadius: sw(6),
  },
  imgInner: {width: '100%', height: '100%', borderRadius: sw(12.63), overflow: 'hidden'},
  img: {width: '100%', height: '100%'},
  label: {fontFamily: fonts.secondry, fontSize: sw(12), color: '#000000', textAlign: 'center', lineHeight: sw(14)},
});

export default AllCategoriesScreen;
